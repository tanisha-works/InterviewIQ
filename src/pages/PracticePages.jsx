import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, ChevronDown, CircleHelp, Clock3, FileText, Headphones, LoaderCircle, Mic, MicOff, Pause, Play, RotateCcw, Sparkles, Square, Target, Trash2, UploadCloud, Volume2, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { questions } from "../data/mockData";
import { resumeService } from "../services/resumeService";
import { interviewService } from "../services/interviewService";
import { Badge, Button, Card, PageHeading } from "../components/UI";

const roleOptions = ["Senior Product Designer", "Software Developer", "Product Designer", "Java Developer", "Python Developer", "Data Analyst", "Machine Learning Engineer", "Frontend Developer"];

function formatSize(bytes) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResumePage() {
  const { resume, setResume, config, setConfig } = useApp();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setError("");
    const extensionOkay = /\.(pdf|docx)$/i.test(file.name);
    if (!extensionOkay) { setError("Choose a PDF or DOCX file to continue."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Your resume must be smaller than 10 MB."); return; }
    setBusy(true);
    try { setResume(await resumeService.analyze(file)); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  }

  return <div className="page-stack"><PageHeading eyebrow="MAKE IT PERSONAL" title="Your resume" description="Give InterviewIQ a little context to make your practice feel like the real thing." action={<Button variant="secondary"><CircleHelp size={15} /> How it works</Button>} />
    <div className="resume-layout"><div className="resume-main"><Card className="upload-card"><div className="card-heading"><div><div className="section-eyebrow">STEP 1 OF 2</div><h2>Upload your resume</h2><p>We use your experience to create role-specific questions.</p></div><div className="step-count">01 <span>/ 02</span></div></div>
      {resume ? <div className="uploaded-file"><div className="uploaded-file-icon"><FileText size={22} /></div><div className="uploaded-file-info"><strong>{resume.fileName}</strong><small>{formatSize(resume.size)} · Uploaded just now</small></div><Badge tone="green"><Check size={12} /> Analyzed</Badge><button className="icon-button" aria-label="Remove resume" onClick={() => { setResume(null); localStorage.removeItem("interviewiq-resume"); }}><X size={16} /></button></div> :
      <button className={`drop-zone ${dragging ? "dragging" : ""}`} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); handleFile(event.dataTransfer.files[0]); }}><input ref={inputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={(event) => handleFile(event.target.files[0])} /><div className="upload-icon">{busy ? <LoaderCircle className="spin" size={22} /> : <UploadCloud size={22} />}</div><strong>{busy ? "Analyzing your resume..." : "Drop your resume here, or browse"}</strong><span>PDF or DOCX · Up to 10 MB</span>{busy && <div className="upload-progress"><i /></div>}</button>}
      {error && <div className="form-error">{error}</div>}
      <div className="privacy-note"><span className="privacy-lock">✓</span> Your resume is private and only used to personalize your interview practice.</div>
      {resume && <div className="resume-analysis"><div className="analysis-heading"><div><Badge tone="purple"><Sparkles size={12} /> AI ANALYSIS</Badge><h3>Looking good, Alex!</h3><p>We found some great material to build your interview around.</p></div><div className="match-score"><strong>92%</strong><span>profile strength</span></div></div><div className="resume-facts"><div><small>EXPERIENCE</small><strong>{resume.experience}</strong></div><div><small>EDUCATION</small><strong>{resume.education}</strong></div><div><small>PROJECTS</small><strong>{resume.projects} highlighted</strong></div></div><div className="skills-block"><small>SKILLS WE FOUND</small><div className="skill-tags">{resume.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div></div>}
    </Card>
    <Card className="role-card"><div className="card-heading"><div><div className="section-eyebrow">STEP 2 OF 2</div><h2>Choose your target role</h2><p>We'll tailor questions to the role you're going for.</p></div><div className="step-count">02 <span>/ 02</span></div></div><label className="field-label">JOB TITLE</label><div className="select-wrap"><select value={config.role} onChange={(event) => setConfig({ ...config, role: event.target.value })}>{roleOptions.map((role) => <option key={role}>{role}</option>)}<option value="custom">Other role...</option></select><ChevronDown size={16} /></div>{config.role === "custom" && <input className="text-input custom-role" placeholder="Enter your target job title" onChange={(event) => setConfig({ ...config, role: event.target.value })} />}<div className="role-hint"><Sparkles size={15} /> You can change this anytime when setting up an interview.</div>    <Button className="full-button" onClick={() => navigate("/setup")}>Continue to interview setup <ArrowRight size={16} /></Button></Card></div>
    <aside className="resume-side"><Card className="resume-side-card"><div className="resume-side-visual"><div className="resume-orbit orbit-one" /><div className="resume-orbit orbit-two" /><div className="floating-doc"><FileText size={24} /><span>Resume</span><i /></div><div className="floating-spark"><Sparkles size={16} /></div><div className="floating-check"><Check size={16} /></div></div><Badge tone="purple"><Sparkles size={12} /> PERSONALIZED FOR YOU</Badge><h3>Practice that gets you</h3><p>We look for the experience, skills, and projects that make your story unique.</p><div className="side-benefit"><Check size={15} /> Role-specific questions</div><div className="side-benefit"><Check size={15} /> Relevant follow-ups</div><div className="side-benefit"><Check size={15} /> Feedback grounded in your goals</div></Card><div className="photo-note"><img src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=720&q=85" alt="Professionals collaborating around a table" /><div><strong>Make every practice count</strong><span>Build confidence, one answer at a time.</span></div></div></aside></div>
  </div>;
}

export function SetupPage() {
  const { config, setConfig, user } = useApp();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const update = (key, value) => setConfig({ ...config, [key]: value });
  async function start() {
    setStarting(true); setError("");
    try {
      const session = await interviewService.start(config);
      sessionStorage.setItem("interviewiq-session", JSON.stringify(session));
      navigate("/room");
    } catch (requestError) { setError(requestError.message); } finally { setStarting(false); }
  }
  return <div className="page-stack"><PageHeading eyebrow="MAKE IT YOURS" title="Set up your interview" description="A few quick choices, then you're ready to practice." action={<div className="setup-step"><span>1</span> Setup <i /> <span className="step-muted">2</span> Interview <i /> <span className="step-muted">3</span> Results</div>} />
    <div className="setup-layout"><Card className="setup-card"><div className="setup-section"><div className="setup-section-heading"><div className="setup-step-icon"><FileText size={17} /></div><div><h3>What role are you preparing for?</h3><p>We'll make every question feel relevant.</p></div></div><div className="role-choice-grid">{roleOptions.map((role) => <button key={role} onClick={() => update("role", role)} className={`role-choice ${config.role === role ? "selected" : ""}`}>{role}{config.role === role && <Check size={15} />}</button>)}</div><input className="text-input custom-role" value={roleOptions.includes(config.role) ? "" : config.role} placeholder="Or enter a custom role..." onChange={(event) => update("role", event.target.value)} /></div>
      <div className="setup-divider" /><div className="setup-section"><div className="setup-section-heading"><div className="setup-step-icon peach"><Target size={17} /></div><div><h3>Choose your difficulty</h3><p>There's no wrong place to start.</p></div></div><div className="segmented-control">{["Easy", "Medium", "Hard"].map((item) => <button key={item} className={config.difficulty === item ? "selected" : ""} onClick={() => update("difficulty", item)}>{item}</button>)}</div></div>
      <div className="setup-divider" /><div className="setup-section"><div className="setup-section-heading"><div className="setup-step-icon blue"><Headphones size={17} /></div><div><h3>Pick your interview style</h3><p>Choose the focus that suits your goals.</p></div></div><div className="interview-type-grid">{[["Technical","Role-specific skills and problem solving"],["HR","Behavioral and culture fit questions"],["Mixed","A little of everything"]].map(([type, detail]) => <button key={type} onClick={() => update("type", type)} className={`interview-type ${config.type === type ? "selected" : ""}`}><span className="radio-dot">{config.type === type && <i />}</span><div><strong>{type}</strong><small>{detail}</small></div></button>)}</div></div>
      <div className="setup-divider" /><div className="setup-section setup-options"><div><div className="setup-section-heading"><div className="setup-step-icon green"><MessageIcon /></div><div><h3>How much time do you have?</h3><p>Set a pace that feels comfortable.</p></div></div><div className="duration-options">{[10, 15, 20, 30].map((minutes) => <button key={minutes} onClick={() => update("duration", minutes)} className={config.duration === minutes ? "selected" : ""}>{minutes} min</button>)}</div></div><div className="question-count"><label htmlFor="question-count">QUESTIONS</label><strong>{config.questions}</strong><input id="question-count" type="range" min="4" max="12" value={config.questions} onChange={(event) => update("questions", Number(event.target.value))} /><div><span>4 questions</span><span>12 questions</span></div></div></div>
      {error && <div className="form-error">{error}</div>}
    </Card>
    <aside className="setup-aside"><Card className="config-summary"><div className="summary-top"><div className="summary-spark"><Sparkles size={17} /></div><span>YOUR SESSION</span><button aria-label="Edit session"><MoreIcon /></button></div><h3>You're all set, {user.name.split(" ")[0]}.</h3><p>Here's what your practice session will look like.</p><div className="summary-detail"><span>Role</span><strong>{config.role || "Custom role"}</strong></div><div className="summary-detail"><span>Difficulty</span><Badge tone={config.difficulty === "Hard" ? "orange" : "purple"}>{config.difficulty}</Badge></div><div className="summary-detail"><span>Interview type</span><strong>{config.type}</strong></div><div className="summary-detail"><span>Questions</span><strong>{config.questions} questions</strong></div><div className="summary-detail"><span>Estimated time</span><strong><Clock3 size={14} /> {config.duration} minutes</strong></div><div className="summary-divider" /><div className="summary-note"><Sparkles size={15} /><span>Your AI interviewer will adapt follow-up questions based on your answers.</span></div><Button className="full-button start-button" onClick={start} disabled={starting}>{starting ? <><LoaderCircle className="spin" size={16} /> Preparing...</> : <>Start interview <ArrowRight size={16} /></>}</Button><div className="no-pressure"><Volume2 size={13} /> Your microphone will only activate when you start recording.</div></Card><div className="setup-help"><div className="help-avatar"><Headphones size={17} /></div><div><strong>Need a little help?</strong><span>Our quick guide makes your first session easy.</span></div><ArrowRight size={15} /></div></aside></div>
  </div>;
}

function MessageIcon() { return <Volume2 size={17} />; }
function MoreIcon() { return <span className="more-dots">•••</span>; }

export function InterviewRoomPage() {
  const { config } = useApp();
  const [index, setIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);
  const navigate = useNavigate();
  const total = Math.min(config.questions || 8, questions.length);
  const question = questions[index % questions.length];

  useEffect(() => {
    if (!recording) return undefined;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  async function startRecording() {
    setError(""); setNotice(""); setDemoMode(false);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setNotice("Microphone recording isn't available in this browser. You can still practice in demo mode.");
      setRecording(true); setSeconds(0); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true); setSeconds(0);
    } catch (recordingError) {
      if (recordingError.name === "NotAllowedError" || recordingError.name === "PermissionDeniedError") setError("Microphone access was blocked. Allow microphone access in your browser settings, or continue in demo mode.");
      else setError("We couldn't start your microphone. Please check your device and try again.");
    }
  }
  function startDemoRecording() {
    setError("");
    setNotice("Demo mode is active. Stop whenever you're ready to continue.");
    setDemoMode(true);
    setRecording(true);
    setSeconds(0);
  }
  function stopRecording() {
    setRecording(false);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    else setNotice(demoMode ? "Demo answer saved. Connect a microphone to save a real recording." : "Demo recording saved. Connect a microphone to save a real answer.");
  }
  function togglePlayback() {
    if (!audioUrl) { setNotice("Demo answer ready — real playback is available when you record with a microphone."); setPlaying(!playing); return; }
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play().catch(() => setError("We couldn't play this recording. Please record your answer again."));
    setPlaying(!playing);
  }
  function nextQuestion() {
    if (index + 1 >= total) { sessionStorage.setItem("interviewiq-last-score", "86"); navigate("/report"); return; }
    setIndex((value) => value + 1); setAudioUrl(""); setSeconds(0); setPlaying(false); setNotice("");
  }
  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const waveform = [10, 18, 12, 24, 15, 34, 20, 14, 28, 16, 38, 22, 12, 31, 18, 42, 24, 13, 30, 18, 38, 15, 25, 12, 31, 17, 40, 20, 12, 28, 17, 34, 14, 23, 12, 31, 18, 40, 22, 14, 28, 16, 35, 18, 12, 24, 14, 33];

  return <div className="interview-room"><header className="room-header"><button className="room-back" onClick={() => navigate("/setup")}><ArrowLeft size={17} /> Exit interview</button><div className="room-progress"><div className="room-progress-label"><span>QUESTION {index + 1} <i>/ {total}</i></span><strong><Clock3 size={14} /> {String(Math.max(config.duration - Math.floor(seconds / 60), 0)).padStart(2, "0")}:{String(59 - (seconds % 60)).padStart(2, "0")}</strong></div><div className="progress-track"><i style={{ width: `${((index + 1) / total) * 100}%` }} /></div></div><div className="ai-live"><span /> AI INTERVIEWER</div></header>
    <div className="room-body"><div className="room-welcome"><div className="ai-orb"><div className="orb-ring" /><Sparkles size={26} /></div><div><span>YOUR INTERVIEWER</span><h2>Let's find your next great story.</h2><p>Take a breath, think it through, and answer like you're talking to a person.</p></div></div>
      <Card className="question-card"><div className="question-meta"><Badge tone="purple">{config.type}</Badge><span>Question {index + 1} of {total}</span><button aria-label="Hear question"><Volume2 size={16} /></button></div><h1>{question}</h1><div className="question-hint"><Sparkles size={14} /><span>Take your time. You can re-record your answer before moving on.</span></div></Card>
      <Card className="recording-card"><div className="recording-card-top"><div><h3>Your answer</h3><p>Speak naturally — there's no need to rush.</p></div><div className={`record-status ${recording ? "is-recording" : audioUrl ? "has-recording" : ""}`}><i />{recording ? "Recording" : audioUrl ? "Answer recorded" : "Ready when you are"}</div></div>
        <div className={`waveform ${recording ? "wave-active" : ""}`}>{waveform.map((height, i) => <i key={i} style={{ height: `${recording ? height + (i % 3) * 7 : audioUrl ? height * 0.6 : 5}px`, animationDelay: `${i * 22}ms` }} />)}</div>
        <div className="recording-timer"><span>{time}</span><span>{recording ? "RECORDING IN PROGRESS" : audioUrl ? "ANSWER DURATION" : "MAX. 3 MINUTES"}</span><span>{recording ? <span className="recording-pulse" /> : <Mic size={15} />}</span></div>
        {error && <div className="form-error room-error"><MicOff size={15} />{error}</div>}{notice && <div className="room-notice">{notice}</div>}
        <div className="recording-controls">{recording ? <Button variant="danger" onClick={stopRecording}><Square size={13} fill="currentColor" /> Stop recording</Button> : !audioUrl ? <><Button onClick={startRecording}><Mic size={16} /> Start recording</Button><Button variant="secondary" onClick={startDemoRecording}><Play size={14} /> Try demo mode</Button></> : <><Button variant="secondary" onClick={togglePlayback}>{playing ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}{playing ? "Pause" : "Play answer"}</Button><Button variant="secondary" onClick={() => { setAudioUrl(""); setSeconds(0); setNotice(""); }}><Trash2 size={15} /> Delete</Button><Button variant="secondary" onClick={startRecording}><RotateCcw size={15} /> Re-record</Button></>}
        </div><audio ref={audioRef} src={audioUrl || undefined} onEnded={() => setPlaying(false)} />
      </Card>
      <div className="room-footer"><div><span className="secure-dot" /> Your recording stays private</div><Button onClick={nextQuestion} disabled={recording}>{index + 1 === total ? "Finish interview" : audioUrl ? "Submit & continue" : "Skip question"} <ArrowRight size={16} /></Button></div>
      <div className="room-microcopy">Your answers are evaluated for communication, relevance, confidence, and clarity.</div>
    </div>
  </div>;
}
