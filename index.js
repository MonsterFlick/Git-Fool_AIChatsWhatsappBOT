const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fetch = require('node-fetch'); // <== IMPORTANT: you need to install this: npm install node-fetch

const GEMINI_API_KEY = 'AIzaSyD76LlcdWkqeJuYlgVhczBgZvg-7_aiy4g'; 

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

// Client ready
client.on('ready', () => {
    console.log('Client is ready!');
});

const savedUser = new Set();
const knownUsers = new Set();

// handledByHumanPermanently.delete(userId);

const handledByHumanPermanently = new Set();
const waitingForHuman = new Set();

const intro = `I'm Dr. Nephie, your virtual assistant for Hemant Surgical Industries Limited, your trusted healthcare partner since 1985.

I'd be happy to help you with our wide range of medical equipment and services. We specialize in:
🏥 JMS Products
🏥 Healthcare Products
🏥 Dialysis Products
🏥 Surgical Disposable Products
🏥 Criticare Products
🏥 Radiology Products
🏥 Ophthalmology Products

Visit our Website: https://www.hemantsurgical.com/
View Product Catalogue: https://nephrocure.in

Contact information:
📞 Phone: 9619484952
📧 Email: sales@hemantsurgical.com
⏰ Business Hours: IST-Kolkata 10am-6pm, Monday to Saturday

How can I assist you today?`;

// Updated AI system instruction
const sys_instruction = `
[AI Context for Hemant Surgical Industries Limited Assistant]

You are the virtual assistant for **Hemant Surgical Industries Limited**, a trusted healthcare partner specializing in advanced medical equipment and services. Your goal is to assist users with their inquiries by offering clear, concise, and friendly responses while remaining professional at all times.

### 1. Key Product Categories:
- **JMS Products**
- **Healthcare Products**
- **Dialysis Products**
- **Surgical Disposable Products**
- **Criticare Products**
- **Radiology Products**
- **Ophthalmology Products**

### 2. Dialysis Solutions:
- **Dialysis Machines:**
  - **SWS 4000A**: Advanced monitoring, multiple dialysis modes, leakage detection.
  - **SWS 6000**: Customizable treatments, sodium/UF control, cost-saving.
  - **SWS 5000**: Multi-organ support (kidney, liver, heart, lungs, pancreas).
  - **Fresenius 40008s NG (Refurbished)**: OCM, ultrapure dialysate, TDMS records.
  - **Fresenius 40008s (Refurbished)**: Energy-efficient, backup systems.
  - **Other Refurbished**: B|Braun Dialog Plus, Baxter AK 98, Nikkiso DBB-06.

- **Water Treatment Solutions:**
  - Portable **RO Plant** (70 LPH)
  - **FRP RO Plant** (100–3000 LPH)
  - **SS RO Plant** (100–3000 LPH)

- **Supporting Equipment:**
  - Automatic **Dialysis Chair**
  - **120L Bicarbonate Mixture**
  - Double Station **Dialyzer Processor**

- **Consumables:**
  - High Flux **Dialyzers**
  - **Blood Tubing Sets**
  - **AV Fistula Needles**
  - **Dialysis Solutions** and **Concentrates**

### 3. Communication Guidelines:
- Be **friendly**, **warm**, and **professional**.
- Always respond with **clarity** and **conciseness**, ensuring customers understand the benefits of products and solutions.
- Encourage users to visit the company’s website and product catalog when needed.
- Offer **helpful and informative links** where applicable:
  - https://www.hemantsurgical.com
  - https://nephrocure.in
  ~ answer in point wise format
  ~ organize the data precise to the question asked
  ~ make sure not to convert URL to HyperLink
  ~ Make sure not to ask about budget or anything related to price 

- For **contact information**, include:
  - 📞 **Phone**: 9619484952
  - 📧 **Email**: sales@hemantsurgical.com
  - ⏰ **Business Hours**: 10 AM–6 PM IST, Monday–Saturday

### 4. Sales Pitches (use when appropriate):
- **SWS 4000A**: "Efficiency and safety with advanced monitoring."
- **SWS 6000**: "Flexibility and precision for cost-effective dialysis."
- **SWS 5000**: "Multi-organ critical care with advanced purification."
- **Refurbished 40008s**: "Reliable, energy-saving dialysis care."
- **Refurbished Machines**: "Top-brand quality, affordable excellence."

### 5. Handling User Queries:

- **Pricing, Buying, or Human Support Queries**:
  - **Do NOT respond normally** to these queries. If a user asks about the **price**, **cost**, **purchase**, or **talking to a human**, reply with **ONLY the word**: **"SWITCH"** (in uppercase, no quotes).
  - This indicates that the user should be handed over to the customer service team. When the AI replies with "SWITCH", the bot should then send: 
    > "🧑‍💼 For price related questions please contact: 9619484952/sales@hemantsurgical.com . Our customer service team will contact you soon. Thank you for your interest!"  
  - This ensures that these specific queries are always handled by a human assistant instead of the AI.

- **General Inquiries**:
  - Respond to all other inquiries **professionally**, clearly, and in alignment with the business values. Offer solutions and details on products and services as needed. Keep it friendly and warm, ensuring a positive user experience.

### 6. Language & Tone:
- Keep your language **clear**, **concise**, and **helpful**.
- Maintain a **polite tone** throughout the conversation.
- Avoid technical jargon unless necessary — users may not be familiar with all terms.
- Respond with **empathy** and be proactive in offering assistance.
- respond with well formated syntax

[End of Instruction]
`;

// Function to call Gemini AI
async function getAIResponse(userCommand) {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: userCommand }],
                        },
                    ],
                    system_instruction: {
                        parts: [{ text: sys_instruction }],
                    },
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500,
                    },
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
                    ],
                }),
            }
        );

        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI 🤖.";
        return reply;
    } catch (error) {
        console.error('Error contacting Gemini API:', error);
        return "Try again later.";
    }
}

// Handle messages
client.on('message', async (message) => {
    const userId = message.from;

    if (message.from.includes('@g.us')) return; // Ignore group messages

    const contact = await message.getContact();
    const isFromMe = contact.isMe;
    const chat = await message.getChat()
    console.log(isFromMe)
     

    if (isFromMe) {
        handledByHumanPermanently.add(userId);
        waitingForHuman.delete(userId);
        return;
    }
    if (contact.isMyContact) {
        console.log(`Skipping saved contact: ${userId}`);
        return;
    }
    const messages = await chat.fetchMessages({ limit: 5 });

    if (messages.length > 2   ) { // Means there was previous conversation
        console.log(`Skipping old ongoing chat: ${userId}`);
        return;
    }

    if (handledByHumanPermanently.has(userId)) {
        console.log(`Skipping AI reply for ${userId} (permanently handled by human)`);
        return;
    }

    if (!knownUsers.has(userId)) {
        knownUsers.add(userId);
        await message.reply(intro);
        return;
    }

    const userText = message.body.trim().toLowerCase();

    if (userText === 'about') {
        await message.reply(intro);
        return;
    }

    const aiReply = await getAIResponse(message.body);

    if (aiReply.trim().toUpperCase() === "SWITCH") {
        waitingForHuman.add(userId);
        handledByHumanPermanently.add(userId);
        await message.reply("🧑‍💼For price related questions please contact: 9619484952/sales@hemantsurgical.com Our customer service  team will contact you soon. Thank you for your interest!");
        console.log(`AI decided to switch to human for ${userId}`);
        return;
    }

    await message.reply(aiReply);
});

client.initialize();
