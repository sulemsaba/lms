import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import Icon from "@/components/ui/Icon";
import { useAuthStore } from "@/stores/authStore";
import styles from "./AITutor.module.css";

interface Message {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

// AI response templates for demo mode
const AI_RESPONSES: Record<string, string> = {
  hello: "Hey there! I'm your AI Learning Assistant. Ask me anything about your courses, assignments, or concepts you're struggling with. I can help explain topics, provide practice questions, or just guide you through problems step by step.",
  default: "Great question! Let me help you understand this step by step.\n\n**Key Concept**: This builds on what you learned in the previous module.\n\n**Think About It**: Why do you think this approach works? What would happen if we changed one variable?\n\n**Hint**: Try breaking the problem into smaller parts - what's the first thing you need to figure out?",
  help: "I can help you with:\n\n**Course Concepts** - Explain any topic from your courses\n**Practice Questions** - Generate questions to test your understanding\n**Assignment Help** - Guide you through assignments (without giving answers)\n**Study Tips** - Suggest study strategies based on your progress\n\nWhat would you like help with?",
  practice: "Here are 3 practice questions to test your understanding:\n\n**Basic**: Can you define the core concept in your own words?\n\n**Apply**: How would you use this concept to solve a real problem?\n\n**Analyze**: What happens if you change a key assumption?\n\nTry answering these and I'll give you feedback.",
  concept: "Let me break this down for you:\n\n**Core Idea**: At its simplest, this is about understanding how things work together.\n\n**Think of it like**: A recipe - each step builds on the previous one.\n\n**Key Takeaway**: Focus on the fundamental principle, and the details will start to make sense.\n\nWhat specific part would you like me to explain further?",
  hint: "Here's a hint to guide your thinking:\n\n**Look at it from a different angle** - What if you worked backwards from the answer?\n\n**Ask yourself**: What information is given? What am I trying to find? What connects them?\n\n**Remember**: The journey of understanding is more important than just getting the right answer."
};

const SUGGESTED_QUESTIONS = [
  "Help me understand this concept",
  "Give me practice questions",
  "I need a hint",
  "How do I study for this?",
  "Explain like I'm 5"
];

export default function AITutor() {
  const user = useAuthStore((state) => state.user);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: `Hey ${user?.name || 'Student'}! 👋 I'm your AI tutor. Ask me anything about your courses, and I'll help you understand concepts step by step. No direct answers - just guidance! 🎯`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const simulateResponse = (userMessage: string) => {
    const lower = userMessage.toLowerCase();
    let response = AI_RESPONSES.default;

    if (lower.includes('hello') || lower.includes('hi ') || lower.includes('hey')) {
      response = AI_RESPONSES.hello;
    } else if (lower.includes('help') || lower.includes('what can you')) {
      response = AI_RESPONSES.help;
    } else if (lower.includes('practice') || lower.includes('question') || lower.includes('quiz')) {
      response = AI_RESPONSES.practice;
    } else if (lower.includes('concept') || lower.includes('explain') || lower.includes('understand')) {
      response = AI_RESPONSES.concept;
    } else if (lower.includes('hint') || lower.includes('stuck') || lower.includes('dont know')) {
      response = AI_RESPONSES.hint;
    }

    return response;
  };

  const handleSend = () => {
    const content = input.trim();
    if (!content || isTyping) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: simulateResponse(content),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    // Focus the input
    inputRef.current?.focus();
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.avatarIcon}>
            <Icon name="auto_awesome" size={20} />
          </div>
          <div className={styles.headerText}>
            <h3>AI Tutor</h3>
            <p>Ask me anything about your courses</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.length === 1 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><Icon name="smart_toy" size={48} /></div>
            <p className={styles.emptyTitle}>Your AI Tutor is Ready!</p>
            <p className={styles.emptyDesc}>
              Ask me to explain concepts, give practice questions,<br />
              or help you work through problems step by step.
            </p>
            <div className={styles.quickPrompts}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  className={styles.quickPrompt}
                  onClick={() => handleQuickPrompt(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`${styles.message} ${styles[msg.role]}`}>
            <div className={styles.messageAvatar}>
              <Icon name={msg.role === 'ai' ? 'smart_toy' : 'person'} size={18} />
            </div>
            <div>
              <div className={styles.messageContent}>{msg.content}</div>
              <div className={styles.messageTime}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className={`${styles.message} ${styles.ai}`}>
            <div className={styles.messageAvatar}>
              <Icon name="smart_toy" size={18} />
            </div>
            <div className={styles.typing}>
              <div className={styles.typingDots}>
                <div className={styles.typingDot} />
                <div className={styles.typingDot} />
                <div className={styles.typingDot} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          {/* Suggestion Chips */}
          {messages.length > 1 && (
            <div className={styles.suggestionChips}>
              {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
                <button
                  key={q}
                  className={styles.suggestionChip}
                  onClick={() => handleQuickPrompt(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <div className={styles.inputRow}>
            <textarea
              ref={inputRef}
              className={styles.textInput}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              rows={1}
            />
            <button
              className={styles.sendButton}
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
            >
              <Icon name="send" size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
