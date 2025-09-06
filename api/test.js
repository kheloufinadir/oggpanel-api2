const { google } = require('googleapis');

// IMPORTANT: Set these as Environment Variables in Vercel
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

export default async function (req, res) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/drive.metadata.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Try to list a few files to check permissions
    const driveResponse = await drive.files.list({
      pageSize: 1,
      fields: 'files(name)',
    });

    if (driveResponse.data.files.length > 0) {
      res.status(200).json({ success: true, message: 'Connection to Google Drive successful!' });
    } else {
      res.status(200).json({ success: true, message: 'Connection to Google Drive successful, but no files found.' });
    }
  } catch (error) {
    console.error('Test API Error:', error);
    res.status(500).json({ success: false, message: 'Connection to Google Drive failed!', error: error.message });
  }
}
