import { Request, Response } from 'express';
import Contact from '../models/Contact';

export const submitContact = async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    await Contact.create({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() });

    res.status(201).json({ message: 'Message sent successfully! We will get back to you soon.' });
  } catch (error) {
    console.error('Contact submit error:', error);
    res.status(500).json({ message: 'Server error submitting contact form' });
  }
};
