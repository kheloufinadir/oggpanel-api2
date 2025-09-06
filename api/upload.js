onst { google } = require('googleapis');
const { Readable } = require('stream');

// IMPORTANT: Set these as Environment Variables in Vercel
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
const SPREADSHEET_ID = '1JoFjBPEd48sGa50lqANnn3EQTAkT-FST1tgY6L72xp8';

export default async function (req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { qrCodeId, documentTitle, fileName, fileData } = req.body;

  if (!qrCodeId || !documentTitle || !fileName || !fileData) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // Authorize with Google
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // Upload file to Google Drive
    const buffer = Buffer.from(fileData, 'base64');
    const fileMetadata = {
      'name': fileName,
      parents: ['1z5w9nTVE90CuKza1NHGXgOCswLPRSQTG'], // IMPORTANT: Set this
    };

    const media = {
      mimeType: 'application/pdf',
      body: Readable.from(buffer),
    };

    const driveResponse = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,webViewLink',
    });

    const fileUrl = driveResponse.data.webViewLink;

    // Append a new row to the Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:C',
      valueInputOption: 'RAW',
      resource: {
        values: [[qrCodeId, fileUrl, documentTitle]],
      },
    });

    res.status(200).json({ success: true, message: 'File uploaded and link saved.' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
}
