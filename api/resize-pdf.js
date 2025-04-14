import { IncomingForm } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  if (req.method === 'POST') {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      // Xử lý file ở đây
      res.status(200).json({ message: "File received!" });
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
