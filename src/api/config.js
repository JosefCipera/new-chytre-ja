// config.js

export const GOOGLE_SHEETS_API_KEY = "AIzaSyBLmvNbI-ePMlAXNSdzEP_F6nQwYuk9uA4";
export const spreadsheetId = "1Y8Hzu2OWwq8SENpVSkWPhHHffptWsfD7arUraaRNN3E";
export const SHEET_NAME = "Data";
export const CLIENT_ID = "363128008732-krhn1kmoi32pugoek5qcvc9jus8lcuts.apps.googleusercontent.com";
export const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
export const SCOPES = "https://www.googleapis.com/auth/spreadsheets";
export const updateRange = "'Data'!A1:Z100";
export const GOOGLE_SHEET_URL = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}?key=${GOOGLE_SHEETS_API_KEY}`;

export const GOOGLE_SHEETS_SPREADSHEET_ID = "1GsMotMnkYHH6qicmpFiuq8OBGy5xA0S_JBnM3LlAnZI";
export const GOOGLE_SHEETS_LIST_NAME = "List 2";

// NOVÉ KONSTANTY PRO TABULKU S POVLY (COMMANDS)
export const GOOGLE_SHEETS_COMMANDS_LIST_NAME = "List 1";
export const GOOGLE_SHEETS_COMMANDS_RANGE = "A:C";

export async function loadWebhook() {
    console.log("🚀 Spouštím loadWebhook funkci..."); // NOVÝ LOG
    let webhookUrl = null;
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/'${GOOGLE_SHEETS_LIST_NAME}'!A:B?key=${GOOGLE_SHEETS_API_KEY}`;
        console.log("🔍 Načítám webhook z URL:", url);
        console.log("⏳ Odesílám fetch požadavek..."); // NOVÝ LOG
        const response = await fetch(url);
        console.log("✅ Fetch požadavek dokončen. Status:", response.status); // NOVÝ LOG
        if (!response.ok) {
            console.error(`❌ Chyba při načítání webhooku: ${response.status} ${response.statusText}`); // DETAILNĚJŠÍ LOG
            throw new Error(`Chyba při načítání webhooku: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log("📄 Data z Google Sheets:", data); // NOVÝ LOG: Zobrazí celá data

        const webhookRow = data.values.find(row => row[0] && row[0].trim() === "Webhook");

        if (webhookRow && webhookRow[1]) {
            webhookUrl = webhookRow[1].replace(/"/g, '').trim();
            localStorage.setItem('webhookUrl', webhookUrl);
            console.log("✅ Webhook URL načteno a uloženo:", webhookUrl);
        } else {
            console.warn("⚠️ Webhook URL nebylo nalezeno v tabulce nebo buňka B je prázdná. Zkontrolujte List 2."); // DETAILNĚJŠÍ UPOZORNĚNÍ
        }
    } catch (error) {
        console.error("❌ Kritická chyba při načítání webhooku:", error); // ZMĚNA LOGU
    }
    console.log("🏁 loadWebhook funkce dokončena. Návratová hodnota:", webhookUrl); // NOVÝ LOG
    return webhookUrl;
}