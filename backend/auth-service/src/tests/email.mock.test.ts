// Mock nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockImplementation(() => ({
      verify: jest.fn().mockResolvedValue(true),
      sendMail: jest.fn().mockImplementation(() => 
        Promise.resolve({
          success: true,
          messageId: 'mock-verification-message-id-456'
        })
      )
    }))
  }));
  
  // Mock the email service methods 
  jest.mock('../services/email.service', () => ({
    sendEmail: jest.fn().mockImplementation(() => 
      Promise.resolve({
        success: true,
        messageId: 'mock-message-id-123'
      })
    ),
    sendVerificationEmail: jest.fn().mockImplementation(() => 
      Promise.resolve({
        success: true,
        messageId: 'mock-verification-message-id-456'
      })
    ),
    sendPasswordResetEmail: jest.fn().mockImplementation(() => 
      Promise.resolve({
        success: true,
        messageId: 'mock-reset-message-id-789'
      })
    ),
    sendPasswordChangeNotification: jest.fn().mockImplementation(() => 
      Promise.resolve({
        success: true,
        messageId: 'mock-change-message-id-012'
      })
    )
  }));
  
  // Import the mocked services
  const nodemailer = require('nodemailer');
  const { 
    sendEmail, 
    sendVerificationEmail, 
    sendPasswordResetEmail, 
    sendPasswordChangeNotification 
  } = require('../services/email.service');
  
  describe('Email Service Tests', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    test('nodemailer createTransport should create a working transporter', async () => {
      const transporter = nodemailer.createTransport();
      const result = await transporter.verify();
      
      expect(transporter.verify).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });
  
    test('nodemailer sendMail should send email successfully', async () => {
      const transporter = nodemailer.createTransport();
      const emailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        text: 'Test content'
      };
      
      const result = await transporter.sendMail(emailOptions);
      
      expect(transporter.sendMail).toHaveBeenCalledWith(emailOptions);
      expect(result).toEqual({
        success: true,
        messageId: 'mock-verification-message-id-456'
      });
    });
  
    test('sendEmail should send email with correct options', async () => {
      const emailOptions = {
        to: 'usuario@example.com',
        subject: 'Correo de Prueba',
        html: '<p>Este es un correo de prueba.</p>',
        text: 'Este es un correo de prueba.'
      };
      
      const result = await sendEmail(emailOptions);
      
      expect(sendEmail).toHaveBeenCalledWith(emailOptions);
      expect(result).toEqual({
        success: true,
        messageId: 'mock-message-id-123'
      });
    });
  
    test('sendVerificationEmail should send verification email with correct parameters', async () => {
      const email = 'usuario@example.com';
      const username = 'Usuario';
      const token = 'token-123';
      
      const result = await sendVerificationEmail(email, username, token);
      
      expect(sendVerificationEmail).toHaveBeenCalledWith(email, username, token);
      expect(result).toEqual({
        success: true,
        messageId: 'mock-verification-message-id-456'
      });
    });
  
    test('sendPasswordResetEmail should send reset email with correct parameters', async () => {
      const email = 'usuario@example.com';
      const username = 'Usuario';
      const token = 'token-123';
      
      const result = await sendPasswordResetEmail(email, username, token);
      
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(email, username, token);
      expect(result).toEqual({
        success: true,
        messageId: 'mock-reset-message-id-789'
      });
    });
  
    test('sendPasswordChangeNotification should send notification with correct parameters', async () => {
      const email = 'usuario@example.com';
      const username = 'Usuario';
      
      const result = await sendPasswordChangeNotification(email, username);
      
      expect(sendPasswordChangeNotification).toHaveBeenCalledWith(email, username);
      expect(result).toEqual({
        success: true,
        messageId: 'mock-change-message-id-012'
      });
    });
  });