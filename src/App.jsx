// src/App.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { loadWebhook } from './api/config'; // Importujeme funkci pro načítání webhooku

// --- Nová komponenta pro zobrazení iframe na samostatné stránce ---
function IframeView({ url, onBack }) {
  return (
    // Změna: Kontejner s max-w-7xl, centrovaný a s paddingem
    <div className="flex flex-col items-center min-h-screen w-full max-w-7xl mx-auto bg-gray-100 p-4">
      {url ? (
        <>
          <iframe
            src={url}
            title="Dashboard Content"
            // Změna: iframe je w-full uvnitř max-w-7xl kontejneru a má border-0, outline-none
            className="w-full h-[90vh] border-0 outline-none rounded-md shadow-lg"
            allowFullScreen
          ></iframe>
          <div className="mt-4">
            <button
              onClick={onBack}
              // Změna: Tlačítko modré s hex kódem
              style={{ backgroundColor: '#3498DB' }}
              className="text-white py-2 px-4 rounded-md shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Zpět
            </button>
          </div>
        </>
      ) : (
        <div className="text-center text-red-500">
          Chyba: Žádné URL k zobrazení.
          <button
            onClick={onBack}
            // Změna: Tlačítko modré s hex kódem
            style={{ backgroundColor: '#3498DB' }}
            className="mt-4 text-white py-2 px-4 rounded-md shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Zpět
          </button>
        </div>
      )}
    </div>
  );
}

// --- Komponenta pro zjednodušené rozhraní agenta (příkazový vstup) ---
function AgentView({ agentName, description, onBack, onDisplayIframe }) {

  const [userInput, setUserInput] = useState("");
  const [latestAiResponse, setLatestAiResponse] = useState("");
  const [responseSeverity, setResponseSeverity] = useState('blue');
  const [loading, setLoading] = useState(false);
  const [displayMediaContent, setDisplayMediaContent] = useState(null); // Může být { type: 'image'|'audio'|'video', src: 'url' }
  const [makeWebhookUrl, setMakeWebhookUrl] = useState(null);

  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // --- NOVÉ STAVOVÉ PROMĚNNÉ PRO HLAS ---
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null); // Reference pro SpeechRecognition objekt

  // --- FUNKCE PRO ZPRACOVÁNÍ PŘÍKAZU ---
  // Nyní přijímá i makeWebhookUrl jako argument
  const processCommand = useCallback(async (commandTextFromVoice = null, webhookUrlFromVoice = null) => { // ZMĚNA ZDE! Přidán useCallback
    const command = commandTextFromVoice || userInput;

    if (!command.trim()) {
      setLatestAiResponse("Prosím zadejte příkaz.");
      setResponseSeverity('red');
      return;
    }

    // Použijeme URL předané z hlasu, nebo to ze stavu makeWebhookUrl
    const urlToUse = webhookUrlFromVoice || makeWebhookUrl; // ZMĚNA ZDE!

    if (!urlToUse) { // ZMĚNA ZDE!
      setLatestAiResponse("Chyba: Webhook URL není k dispozici. Zkuste to prosím později.");
      setResponseSeverity('red');
      return;
    }

    setLoading(true);
    setLatestAiResponse("Odesílám příkaz...");
    setResponseSeverity('informative');
    setDisplayMediaContent(null); // Vyčistí předchozí médium při odesílání nového příkazu

    try {
      // Přídání příkazu do historie, pokud není duplikát posledního
      if (commandHistory.length === 0 || commandHistory[0] !== command) {
        setCommandHistory(prev => [command, ...prev].slice(0, 10)); // Udržujeme posledních 10 příkazů
        setHistoryIndex(-1); // Resetujeme index historie po odeslání nového příkazu
      }

      console.log(`Odesílám příkaz na Make.com: ${command} na URL: ${urlToUse}`);
      const response = await fetch(urlToUse, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: command }),
      });

      const responseText = await response.text(); // Získáme raw text odpovědi

      // --- Speciální ošetření pro odpověď "Accepted" ---
      if (responseText === "Accepted") {
        setLatestAiResponse("Příkaz byl úspěšně přijat službou Make.com.");
        setResponseSeverity('green'); // Zelená pro úspěšné přijetí
        setLoading(false);
        setUserInput("");
        return; // Důležité: Ukončíme funkci
      }
      // --- KONEC ZMĚN ---

      let data; // Deklarujeme proměnnou 'data' zde
      try {
        data = JSON.parse(responseText); // Pokusíme se parsovat jako JSON
      } catch (jsonError) {
        console.error("Chyba při parsování JSON odpovědi:", jsonError);
        console.error("Odpověď, která způsobila chybu:", responseText);
        setLatestAiResponse(`Chyba: ${responseText || 'Neznámá odpověď z Make.com.'}`);
        setResponseSeverity('red');
        setLoading(false);
        setUserInput("");
        return; // Důležité: Ukončíme funkci, pokud JSON není validní
      }


      if (!response.ok) {
        console.error("Make.com vrátil chybový HTTP status:", response.status, responseText);
        setLatestAiResponse(`Make.com HTTP chyba: ${response.status} - ${data.message || 'Neznámá chyba'}.`);
        setResponseSeverity('red');
        return; // Důležité: Ukončíme, pokud je HTTP chyba
      }

      console.log("DEBUG: Celá odpověď z Make.com (parsovaná):", data);
      console.log("DEBUG: Typ data.status:", typeof data.status, "Hodnota:", data.status);
      console.log("DEBUG: Typ data.response_type:", typeof data.response_type, "Hodnota:", data.response_type);
      console.log("DEBUG: Typ data.response_data:", typeof data.response_data, "Hodnota:", data.response_data);

      // --- Zpracování odpovědi a barvy ---
      if (data.response_type === 'notification' && data.response_data && data.response_data.message) {
        setLatestAiResponse(`${data.response_data.message}`);
        setResponseSeverity(data.response_data.severity || 'blue'); // Fallback na blue
      } else if (data.response_type === 'text') {
        setLatestAiResponse(`${data.response_data}`);
        setResponseSeverity('green');
      } else if (data.response_type === 'iframe' || data.response_type === 'url' || data.response_type === 'document_url') {
        onDisplayIframe(data.response_data);
        setLatestAiResponse("Přesměrovávám na obsah...");
        setResponseSeverity('blue');
      } else if (data.response_type === 'image') {
        setDisplayMediaContent({ type: 'image', src: data.response_data, alt: 'Obrázek z AI' });
        setLatestAiResponse("Zobrazen obrázek z AI.");
        setResponseSeverity('blue');
      } else if (data.response_type === 'audio') { // NOVINKA: Zpracování audia
        setDisplayMediaContent({ type: 'audio', src: data.response_data, alt: 'Audio z AI' });
        setLatestAiResponse("Přehrávám audio z AI.");
        setResponseSeverity('blue');
      } else if (data.response_type === 'video') { // NOVINKA: Zpracování videa
        setDisplayMediaContent({ type: 'video', src: data.response_data, alt: 'Video z AI' });
        setLatestAiResponse("Přehrávám video z AI.");
        setResponseSeverity('blue');
      }
      else {
        setLatestAiResponse(`Make.com: Neznámý typ odpovědi nebo chybějící data. ${data.message || 'Neznámá chyba'}.`);
        setResponseSeverity('orange');
      }

    } catch (error) {
      console.error("Kritická chyba při odesílání příkazu do Make.com:", error);
      setLatestAiResponse(`Kritická chyba komunikace: ${error.message}.`);
      setResponseSeverity('red');
    } finally {
      setLoading(false);
      setUserInput(""); // Vyčistí vstupní pole po odeslání
    }
  }, [userInput, makeWebhookUrl, commandHistory, onDisplayIframe]);


  useEffect(() => {
    const getWebhook = async () => {
      console.log("➡️ Volám getWebhook v useEffect...");

      let url = null;
      try {
        console.log("🚀 Spouštím loadWebhook funkci přes await...");
        url = await loadWebhook();
        console.log("✅ loadWebhook vrátil:", url);
      } catch (error) {
        console.error("❌ Chyba při volání loadWebhook:", error);
      }

      // I když se nyní zdá, že webhook načítá, toto je dobrý fallback
      if (!url) {
        console.log("Fallback: Načítám webhook URL z localStorage...");
        url = localStorage.getItem('webhookUrl');
        if (url) {
          console.log("✅ Webhook URL načteno z localStorage:", url);
        } else {
          console.warn("⚠️ Webhook URL není ani v localStorage.");
        }
      }

      if (url) {
        setMakeWebhookUrl(url);
        console.log("Webhook URL nastaveno do stavu pro AgentView:", url);
      } else {
        console.error("Nepodařilo se načíst Webhook URL z Google Sheets nebo localStorage.");
        setLatestAiResponse("Chyba: Webhook URL nebylo načteno. Zkontrolujte konfiguraci.");
        setResponseSeverity('red');
      }
    };
    getWebhook();

    // --- Inicializace SpeechRecognition API ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'cs-CZ';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setLatestAiResponse("Naslouchám...");
        setResponseSeverity('informative'); // Změna na 'informative' (bude modrá)
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        setLatestAiResponse("Rozpoznáno: " + transcript);
        setResponseSeverity('blue'); // Rozpoznáno je modře

        // Použijeme callback pro setMakeWebhookUrl pro jistotu aktuální hodnoty
        // a předáme ji processCommand
        setMakeWebhookUrl(currentUrl => {
          const urlToUse = currentUrl || localStorage.getItem('webhookUrl'); // Fallback na localStorage
          if (urlToUse) {
            processCommand(transcript, urlToUse); // Voláme processCommand s textem A URL
          } else {
            setLatestAiResponse("Chyba: Webhook URL není k dispozici pro hlasový povel. Zkuste to prosím později.");
            setResponseSeverity('red');
          }
          setIsListening(false); // Zastavíme naslouchání po zpracování
          return currentUrl; // Vrátíme aktuální URL pro zachování stavu
        });
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Chyba rozpoznávání řeči:", event.error);
        setIsListening(false);
        setLatestAiResponse(`Chyba hlasového vstupu: ${event.error}.`);
        setResponseSeverity('urgent');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.warn("Speech Recognition API není podporováno ve vašem prohlížeči.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };

  }, [processCommand]);


  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setUserInput("");
      setLatestAiResponse("");
      recognitionRef.current.start();
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setUserInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setUserInput(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setUserInput("");
      }
    }
  }, [commandHistory, historyIndex]);

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'red':
        return 'bg-red-100 text-red-700 border border-l-4 border-red-500';
      case 'green':
        return 'bg-green-100 text-green-700 border border-l-4 border-green-500';
      case 'blue':
        return 'bg-blue-100 text-blue-700 border border-l-4 border-blue-500';
      case 'orange':
        return 'bg-orange-100 text-orange-700 border border-l-4 border-orange-500';
      case 'informative':
        return 'bg-blue-100 text-blue-700 border border-l-4 border-blue-500';
      case 'urgent':
        return 'bg-red-100 text-red-700 border border-l-4 border-red-500';
      case 'success':
        return 'bg-green-100 text-green-700 border border-l-4 border-green-500';
      case 'warning':
        return 'bg-orange-100 text-orange-700 border border-l-4 border-orange-500';
      default:
        return 'bg-gray-100 text-gray-700 border border-l-4 border-gray-500';
    }
  };

  return (
    <div className="agent-command-container bg-white rounded-lg shadow-xl p-6 max-w-7xl w-full mx-auto flex flex-col items-center">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-4 hidden sm:block">{agentName}</h2>
      <p className="text-center text-gray-600 mb-6 hidden sm:block">{description}</p>

      <div className="microphone-container mb-6 flex flex-col items-center">
        <img
          id="microphoneIcon"
          src="images/microphone-192.png"
          alt="Microphone Icon"
          className={`mic-icon w-36 h-36 mb-2 opacity-75 cursor-pointer ${isListening ? 'animate-pulse' : ''}`}
          onClick={toggleListening}
          title={isListening ? "Zastavit nahrávání" : "Spustit hlasové zadávání"}
        />
        {isListening && (
          <>
            <div className="wave wave1"></div>
            <div className="wave wave2"></div>
            <div className="wave wave3"></div>
          </>
        )}
      </div>

      {latestAiResponse && (
        <div className={`voice-status p-3 rounded-lg mb-6 ${getSeverityClass(responseSeverity)} w-fit mx-auto`}>
          {latestAiResponse}
        </div>
      )}

      {/* NOVINKA: Zobrazení media obsahu (image, audio, video) */}
      {displayMediaContent && (
        <div className="mt-4 w-full text-center mb-6">
          {displayMediaContent.type === 'image' && (
            <img src={displayMediaContent.src} alt={displayMediaContent.alt} className="max-w-full h-auto mx-auto" />
          )}
          {displayMediaContent.type === 'audio' && (
            <audio controls src={displayMediaContent.src} className="w-full max-w-md mx-auto" onError={(e) => console.error("Audio loading error:", e.target.error, displayMediaContent.src)}></audio>
          )}
          {displayMediaContent.type === 'video' && (
            <video controls src={displayMediaContent.src} className="w-full max-w-md mx-auto" style={{ maxHeight: '400px' }} onError={(e) => console.error("Video loading error:", e.target.error, displayMediaContent.src)}></video>
          )}
        </div>
      )}

      <div className="w-full sm:w-2/3 md:w-1/2 lg:w-1/3 mb-4 max-w-md">
        <input
          type="text"
          id="userInput"
          className="w-full border border-gray-300 rounded-md p-3 text-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Napište příkaz, např. Kontrola dat."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => { if (e.key === 'Enter') processCommand(); }}
          onKeyDown={handleKeyDown}
          disabled={isListening}
        />
      </div>

      <div className="flex justify-center space-x-4 mt-4 w-full">
        <button
          onClick={() => processCommand()}
          disabled={loading || !makeWebhookUrl || isListening}
          style={{ backgroundColor: '#3498DB' }}
          className="text-white py-2 px-4 rounded-md shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {loading ? "Odesílám..." : "Odeslat"}
        </button>
        <button
          onClick={onBack}
          style={{ backgroundColor: '#3498DB' }}
          className="text-white py-2 px-4 rounded-md shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Zpět na Marketplace
        </button>
      </div>
    </div>
  );
}

// --- Komponenta pro Marketing Agenta (s původním obsahem z vašeho souboru) ---
function MarketingAgentSpecificView({ onBack }) {
  const [postText, setPostText] = useState("");
  const [generatedPost, setGeneratedPost] = useState("");
  const [loading, setLoading] = useState(false);
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

  const extractDataFromLinkedin = () => {
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

    console.log("Odesílám kontakt do Make.com/HubSpot:", { firstName, lastName, email, company, industry, numEmployees, position, notes });

    setTimeout(() => {
      setMessage("Kontakt byl úspěšně uložen (simulace)!");
      setLoading(false);
    }, 1500);
  };

  const handleGenerateAiContent = async () => {
    setLoading(true);
    setAiResponse("");
    setError(null);
    setMessage(null);

    console.log("Generuji AI obsah pro dotaz:", aiPrompt);

    try {
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
      <header className="w-full bg-[#2c3e50] text-white p-8 text-center shadow-md">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Smart Agent Platform</h1>
        <h2 className="text-lg sm:text-xl mt-2 text-white">Centrum specializovaných agentů</h2>
      </header>

      <section className="w-full max-w-4xl bg-[#e6f0fa] rounded-lg mx-auto mt-12 p-8 text-center shadow-md">
        <p className="text-lg text-[#666]">Vyberte agenty, které potřebujete. Jedna aplikace - nekonečné možnosti.</p>
      </section>

      <main className="w-full max-w-7xl p-6 mt-8 flex-grow">
        <div className="marketplace-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center">
          {agents.map((agent) => (
            <div key={agent.type} className="marketplace-item bg-[#e6f0fa] rounded-lg shadow-md p-8 text-center transition-transform duration-200 hover:scale-105 flex flex-col items-center justify-between w-full max-w-sm">
              <img
                src={agent.image}
                alt={agent.name}
                className="w-48 h-48 object-contain mb-4 cursor-pointer shadow-md"
                onClick={() => onLaunchAgent(agent.type)}
              />
              <h3 className="text-xl font-semibold text-[#2c3e50] mb-2">{agent.name}</h3>
              <p className="text-center text-[#666] text-sm mb-2">
                {agent.description}
              </p>
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

      <footer className="w-full bg-[#2c3e50] text-white text-center p-4">
        <p>© 2025 Smart Agent Platform. Všechna práva vyhrazena.</p>
      </footer>
    </div>
  );
}


// Hlavní komponenta aplikace
function App() {
  const [currentView, setCurrentView] = useState('marketplace');
  const [iframeUrl, setIframeUrl] = useState(null);
  const [previousAgentView, setPreviousAgentView] = useState(null);

  const launchAgent = (agentType) => {
    setPreviousAgentView(agentType);
    setCurrentView(agentType);
  };

  const handleDisplayIframe = (url) => {
    setIframeUrl(url);
    setCurrentView('iframe_view');
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
        const agentInfo = {
          finance: { name: "AI agent Finance", description: "Specialista na finanční řízení a podporu rozhodování." },
          vyroba: { name: "AI agent Výroba", description: "Expert na plánování výroby a simulaci vytížení kapacit." },
          strateg: { name: "AI agent Stratég", description: "Specialista na inovativní byznys modely a strategie." },
        };
        const { name, description } = agentInfo[currentView];
        return <AgentView agentName={name} description={description} onBack={() => setCurrentView('marketplace')} onDisplayIframe={handleDisplayIframe} />;
      case 'iframe_view':
        return (
          <IframeView
            url={iframeUrl}
            onBack={() => setCurrentView(previousAgentView || 'marketplace')}
          />
        );
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