import React, { useState, useEffect, useRef } from "react";
// Příklad importu v App.jsx
// import { initChytrJA, callAgent } from './ai-orchestration/chytrJA.js'; // Předpokládám, že chytrJA.js exportuje funkce
// ... a pokud chcete přímo importovat agenty pro testování
// import commandAgent from './ai-orchestration/agents/commandAgent.js';
// import marketingAgent from './ai-orchestration/agents/marketingAgent.js';

// Komponenta pro generické chatovací rozhraní agenta
function AgentView({ agentName, description, onBack }) {

  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatHistoryRef = useRef(null);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const processCommand = async () => {
    if (!userInput.trim()) return;

    setChatHistory((prev) => [...prev, { text: userInput, sender: "user" }]);
    setUserInput("");
    setLoading(true);

    try {
      // Zde by se volala skutečná AI orchestrace pro daného agenta
      // Pro tuto fázi pouze simulujeme odpověď
      const simulatedResponse = `Ahoj! Jsem ${agentName}. Zpracoval/a jsem váš dotaz: "${userInput}". Momentálně jsem ve vývoji, ale v budoucnu vám pomohu s: ${description}.`;

      setTimeout(() => {
        setChatHistory((prev) => [...prev, { text: simulatedResponse, sender: "ai" }]);
        setLoading(false);
      }, 1000); // Simulace načítání

    } catch (error) {
      console.error("Chyba při komunikaci s AI:", error);
      setChatHistory((prev) => [...prev, { text: "Omlouvám se, došlo k chybě při zpracování vašeho požadavku.", sender: "ai" }]);
      setLoading(false);
    }
  };

  return (
    <div className="agent-chat-container bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-auto">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">{agentName}</h2>
      <p className="text-center text-gray-600 mb-6">{description}</p>

      <div className="chat-history-container h-64 overflow-y-auto border border-gray-300 rounded-md p-4 mb-4 bg-gray-50" ref={chatHistoryRef}>
        {chatHistory.length === 0 ? (
          <p className="text-gray-500 text-center">Zatím žádná konverzace. Zeptejte se na něco!</p>
        ) : (
          chatHistory.map((msg, index) => (
            <div key={index} className={`mb-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
              <span className={`inline-block p-2 rounded-lg ${msg.sender === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                {msg.text}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="flex">
        <input
          type="text"
          className="flex-grow border border-gray-300 rounded-l-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Zadejte dotaz..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => { if (e.key === 'Enter') processCommand(); }}
        />
        <button
          onClick={processCommand}
          disabled={loading}
          className="bg-indigo-600 text-white py-2 px-4 rounded-r-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {loading ? "Odesílám..." : "Odeslat"}
        </button>
      </div>
      <div className="text-center mt-4">
        <button
          onClick={onBack}
          className="bg-gray-500 text-white py-2 px-4 rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Zpět na Marketplace
        </button>
      </div>
    </div>
  );
}

// Komponenta pro specifický formulář Marketing Agenta
function MarketingAgentSpecificView({ onBack }) {
  // Stavy pro data nového kontaktu (zde pro demo účely)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [numEmployees, setNumEmployees] = useState("");
  const [position, setPosition] = useState("");
  const [notes, setNotes] = useState("");
  const [linkedinText, setLinkedinText] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Funkce pro extrakci dat z LinkedIn textu (zjednodušená verze)
  const extractDataFromLinkedin = () => {
    // Toto je velmi zjednodušená ukázka, skutečná extrakce by vyžadovala robustnější logiku nebo AI
    const extractedFirstName = linkedinText.split(',')[0]?.split(' ')[0] || '';
    const extractedLastName = linkedinText.split(',')[0]?.split(' ')[1] || '';
    const extractedPosition = linkedinText.includes('Pozice:') ? linkedinText.split('Pozice:')[1].split(',')[0].trim() : '';
    const extractedCompany = linkedinText.includes('společnosti') ? linkedinText.split('společnosti')[1].split('.')[0].trim() : '';

    setFirstName(extractedFirstName);
    setLastName(extractedLastName);
    setPosition(extractedPosition);
    setCompany(extractedCompany);
    setMessage("Data extrahována (zjednodušeně).");
  };

  const handleSubmitContact = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    // Simulace odesílání dat
    console.log("Odesílám kontakt do Make.com/HubSpot:", { firstName, lastName, email, company, industry, numEmployees, position, notes });

    // Zde byste volali Váš Make.com webhook
    // const response = await fetch(makeWebhookUrlMarketing, { ... });

    setTimeout(() => {
      setMessage("Kontakt byl úspěšně uložen (simulace)!");
      setLoading(false);
      // Optional: clear form
    }, 1500);
  };

  const handleGenerateAiContent = async () => {
    setLoading(true);
    setAiResponse("");
    setError(null);
    setMessage(null);

    // Simulace volání AI pro generování obsahu
    console.log("Generuji AI obsah pro dotaz:", aiPrompt);

    try {
      // Zde byste volali Vertex AI nebo jinou AI službu
      // const aiResult = await callVertexAI(aiPrompt, { context: { firstName, lastName, company, industry } });
      const simulatedAiResult = `Na základě vašeho požadavku a informací o kontaktu (jméno: ${firstName}, firma: ${company}), zde jsou marketingové nápady: ${aiPrompt}`;

      setAiResponse(simulatedAiResult);
      setMessage("Obsah AI úspěšně vygenerován (simulace).");
    } catch (err) {
      setError("Chyba při generování AI obsahu.");
      console.error("AI Generation Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="marketing-agent-form-container bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-auto">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">AI Asistent Marketing</h2>
      <p className="text-center text-gray-600 mb-6">Pro správu kontaktů a generování marketingových textů.</p>

      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{message}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}

      <form onSubmit={handleSubmitContact} className="space-y-4">
        <div>
          <label htmlFor="linkedinText" className="block text-sm font-medium text-gray-700">Vložte text z LinkedIn profilu (pro automatické předvyplnění):</label>
          <textarea
            id="linkedinText"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows="3"
            placeholder="Např.: Jaroslav Havel, spojení 2. stupně, Vedoucí provozu Předmontáž ve společnosti ŠKODA TRANSPORTATION a.s."
            value={linkedinText}
            onChange={(e) => setLinkedinText(e.target.value)}
          ></textarea>
          <button type="button" onClick={extractDataFromLinkedin} className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Extrahovat data
          </button>
        </div>

        <h3 className="text-xl font-semibold text-gray-800 pt-4 border-t">Základní informace o kontaktu</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 required">Jméno:</label>
            <input type="text" id="firstName" name="firstName" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 required">Příjmení:</label>
            <input type="text" id="lastName" name="lastName" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email:</label>
            <input type="email" id="email" name="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700">Firma:</label>
            <input type="text" id="company" name="company" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700">Průmysl:</label>
            <input type="text" id="industry" name="industry" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={industry} onChange={(e) => setIndustry(e.target.value)} />
          </div>
          <div>
            <label htmlFor="numEmployees" className="block text-sm font-medium text-gray-700">Počet zaměstnanců:</label>
            <input type="number" id="numEmployees" name="numEmployees" min="0" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={numEmployees} onChange={(e) => setNumEmployees(e.target.value)} />
          </div>
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700">Pozice:</label>
            <input type="text" id="position" name="position" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={position} onChange={(e) => setPosition(e.target.value)} />
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Doplňující informace / Poznámky AI asistenta:</label>
            <textarea id="notes" name="notes" rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button type="submit" disabled={loading} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            {loading ? "Ukládám..." : "Uložit kontakt (do HubSpot přes Make)"}
          </button>
          <button type="reset" onClick={() => { /* clear all states */ }} disabled={loading} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Vyčistit formulář
          </button>
        </div>
      </form>

      <h3 className="text-xl font-semibold text-gray-800 pt-6 border-t mt-6">Interakce s AI Asistentem Marketing</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="aiPrompt" className="block text-sm font-medium text-gray-700">Tvůj požadavek pro AI:</label>
          <textarea
            id="aiPrompt"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows="3"
            placeholder="Např.: Navrhni mi 3 nápady na úvodní e-mail pro tento kontakt, zaměř se na řešení problémů v [Průmysl]."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          ></textarea>
        </div>
        <button
          type="button"
          onClick={handleGenerateAiContent}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          {loading ? "Generuji..." : "Generovat obsah AI"}
        </button>
        {aiResponse && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-lg font-semibold text-blue-800">Odpověď od AI:</h4>
            <p className="mt-2 text-blue-700 whitespace-pre-wrap">{aiResponse}</p>
          </div>
        )}
      </div>
      <div className="text-center mt-4">
        <button
          onClick={onBack}
          className="bg-gray-500 text-white py-2 px-4 rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Zpět na Marketplace
        </button>
      </div>
    </div>
  );
}


// Komponenta pro Marketplace
function MarketplaceView({ onLaunchAgent }) {
  const agents = [
    { name: "AI agent Finance", description: "Specialista na finanční řízení a podporu rozhodování.", image: "images/finance-192.png", type: "finance", url: "finance.html" },
    { name: "AI agent Výroba", description: "Expert na plánování výroby a simulaci vytížení kapacit.", image: "images/vyroba-192.png", type: "vyroba", url: "index.html" },
    { name: "AI agent Marketing", description: "Expert na hodnotovou nabídku a segmentaci zákazníků.", image: "images/marketing-192.png", type: "marketing", url: "marketing.html" },
    { name: "AI agent Stratég", description: "Specialista na inovativní byznys modely a strategie.", image: "images/strateg-192.png", type: "strateg", url: "strateg.html" },
  ];

  return (
    <div className="marketplace-container min-h-screen w-full bg-[#f0f0f0] flex flex-col items-center">
      {/* Hlavička - již upraveno písmo */}
      <header className="w-full bg-[#2c3e50] text-white p-8 text-center shadow-md">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Smart Agent Platform</h1>
        <h2 className="text-lg sm:text-xl mt-2 text-white">Centrum specializovaných agentů</h2>
      </header>

      {/* Sekce s popisem "Vyberte agenty..." */}
      <section className="w-full max-w-4xl bg-[#e6f0fa] rounded-lg mx-auto mt-12 p-8 text-center shadow-md">
        <p className="text-lg text-[#666]">Vyberte agenty, které potřebujete. Jedna aplikace - nekonečné možnosti.</p>
      </section>

      {/* Hlavní obsah s Marketplace gridem */}
      <main className="w-full max-w-7xl p-6 mt-8 flex-grow">
        {/* Zde klíčová změna: Používáme čistý grid systém Tailwindu pro rozestupy */}
        <div className="marketplace-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center"> {/* Vrátili jsme gap-4 pro začátek, můžeme zmenšit na gap-2 */}
          {agents.map((agent) => (
            <div key={agent.type} className="marketplace-item bg-[#e6f0fa] rounded-lg shadow-md p-8 text-center transition-transform duration-200 hover:scale-105 flex flex-col items-center justify-between"> {/* Odebráno width: "250px" */}
              {/* Zvětšení čtverců obrázků agentů - již provedeno v předchozí iteraci */}
              <img
                src={agent.image}
                alt={agent.name}
                className="w-48 h-48 object-contain mb-4 cursor-pointer shadow-md"
                onClick={() => onLaunchAgent(agent.type)}
              />
              <h3 className="text-xl font-semibold text-[#2c3e50] mb-2">{agent.name}</h3>
              {/* Zkrácení mezery pod popisem (mb-2 místo mb-4) a bez flex-grow */}
              <p className="text-center text-[#666] text-sm mb-2">
                {agent.description}
              </p>
              {/* Tlačítko se posune výš díky zmenšenému mb na p tagu a justify-between na rodiči */}
              <button
                onClick={() => onLaunchAgent(agent.type)}
                className="bg-[#3498db] text-white py-2 px-4 rounded-md cursor-pointer transition-colors duration-200 hover:bg-[#2980b9] w-full"
              >
                Spusť agenta
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Patička */}
      <footer className="w-full bg-[#2c3e50] text-white text-center p-4">
        <p>© 2025 Smart Agent Platform. Všechna práva vyhrazena.</p>
      </footer>
    </div>
  );
}


// Hlavní komponenta aplikace
function App() {
  const [currentView, setCurrentView] = useState('marketplace'); // 'marketplace', 'marketing', 'finance', 'vyroba', 'strateg'

  // Funkce pro spuštění agenta a změnu zobrazení
  const launchAgent = (agentType) => {
    setCurrentView(agentType);
  };

  const renderView = () => {
    switch (currentView) {
      case 'marketplace':
        return <MarketplaceView onLaunchAgent={launchAgent} />;
      case 'marketing':
        return <MarketingAgentSpecificView onBack={() => setCurrentView('marketplace')} />;
      case 'finance':
      case 'vyroba':
      case 'strateg':
        // Předáváme název agenta a popis do generické chat komponenty
        const agentInfo = {
          finance: { name: "AI agent Finance", description: "Specialista na finanční řízení a podporu rozhodování." },
          vyroba: { name: "AI agent Výroba", description: "Expert na plánování výroby a simulaci vytížení kapacit." },
          strateg: { name: "AI agent Stratég", description: "Specialista na inovativní byznys modely a strategie." },
        };
        const { name, description } = agentInfo[currentView];
        return <AgentView agentName={name} description={description} onBack={() => setCurrentView('marketplace')} />;
      default:
        return <MarketplaceView onLaunchAgent={launchAgent} />; // Fallback
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 text-gray-900 flex flex-col items-center">
      {renderView()}
    </div>
  );
}

export default App;