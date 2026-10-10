import { useState, useEffect } from "react";
import Groq from "groq-sdk";
import "./App.css";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

function App() {
  const [role, setRole] = useState("React Developer");
  const [level, setLevel] = useState("Beginner");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [number, setNumber] = useState(0);
  const [time, setTime] = useState(300);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showResult, setShowResult] = useState(false);

  async function getQuestion() {
    const r = await groq.chat.completions.create({
      messages: [{
        role: "user",
        content: `Ask one ${level} interview question for ${role}. Give only the question.`
      }],
      model: "openai/gpt-oss-20b"
    });

    setQuestion(r.choices[0].message.content);
  }

  function startInterview() {
    setStarted(true);
    setFinished(false);
    setShowResult(false);
    setNumber(1);
    setScore(0);
    setAnswers([]);
    setAnswer("");
    setTime(300);
    getQuestion();
  }

  useEffect(() => {
    if (!started || finished) return;

    if (time === 0) {
      setFinished(true);
      return;
    }

    const timer = setTimeout(() => setTime(time - 1), 1000);
    return () => clearTimeout(timer);
  }, [time, started, finished]);

  async function nextQuestion() {
    if (!answer.trim()) {
      alert("Please write your answer");
      return;
    }

    const r = await groq.chat.completions.create({
      messages: [{
        role: "user",
        content: `Question: ${question}
Student Answer: ${answer}

Give:
Score: 1 to 10
Correct Answer: short answer

Format:
Score: 8
Correct Answer: ...`
      }],
      model: "openai/gpt-oss-20b"
    });

    const text = r.choices[0].message.content;
    const marks = Number(text.match(/Score:\s*(\d+)/i)?.[1] || 0);
    const correct = text.split("Correct Answer:")[1]?.trim();

    setAnswers([
      ...answers,
      {
        question,
        answer,
        marks,
        correctAnswer: correct || "No answer available."
      }
    ]);

    setScore(score + marks);

    if (number === 5) {
      setFinished(true);
      return;
    }

    setNumber(number + 1);
    setAnswer("");
    getQuestion();
  }

  function startAgain() {
    setStarted(false);
    setFinished(false);
    setShowResult(false);
    setQuestion("");
    setAnswer("");
    setAnswers([]);
    setScore(0);
    setNumber(0);
    setTime(300);
  }

  return (
    <div className="app">
      <div className="container">

        <h1>👾 AI Interview Simulator</h1>

        {!started && !finished && (
          <div>
            <p>Select your role and level.</p>

            <label>Role:</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option>React Developer</option>
              <option>Java Developer</option>
              <option>Python Developer</option>
              <option>Web Developer</option>
            </select>

            <label>Level:</label>
            <select value={level} onChange={e => setLevel(e.target.value)}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>

            <button onClick={startInterview}>Start Interview</button>
          </div>
        )}

        {started && !finished && (
          <div className="interview-page">
            <p><b>Role:</b> {role}</p>
            <p><b>Level:</b> {level}</p>
            <p>
              <b>Time:</b> {Math.floor(time / 60)}:
              {String(time % 60).padStart(2, "0")}
            </p>
            <p>Question {number} of 5</p>

            <div className="question-box">
              <h3>Question</h3>
              <p>{question}</p>
            </div>

            <textarea
              placeholder="Write your answer..."
              value={answer}
              onChange={e => setAnswer(e.target.value)}
            />

            <button onClick={nextQuestion}>Next Question</button>
          </div>
        )}

        {finished && !showResult && (
          <div className="result-box">
            <h2>Interview Completed 🎉</h2>
            <p>Total Score: <b>{score} / 50</b></p>

            <button onClick={() => setShowResult(true)}>
              See Results
            </button>

            <button onClick={startAgain}>
              Start Again
            </button>
          </div>
        )}

        {showResult && (
          <div className="result-box">
            <h2>Interview Results</h2>

            <p><b>Role:</b> {role}</p>
            <p><b>Level:</b> {level}</p>

            <h3>Total Score: {score} / 50</h3>

            {answers.map((item, index) => (
              <div className="question-box" key={index}>
                <p>
                  <b>Question {index + 1}:</b> {item.question}
                </p>

                <p>
                  <b>Your Answer:</b> {item.answer}
                </p>

                <p>
                  <b>Score:</b> {item.marks} / 10
                </p>

                <details>
                  <summary>See Correct Answer</summary>
                  <p>{item.correctAnswer}</p>
                </details>
              </div>
            ))}

            <button onClick={startAgain}>Start Again</button>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;