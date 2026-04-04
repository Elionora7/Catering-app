# Email Testing Guide

## How to Check Email Functionality After Successful Payment

Currently, the email system is set up to **log email content to the console** for testing purposes. Here's how to check if emails are being sent:

### 1. **Check Server Console Logs** (Terminal/Command Prompt)

When a payment is successful and a prebooking is confirmed, the email will be logged in your **server console** (where you run `npm run dev` or `npm start`).

**Look for these log messages:**

```
================================================================================
📧 ORDER CONFIRMATION EMAIL
================================================================================
To: customer@example.com
Subject: Order Confirmation
Name: John Doe
Phone: +61 4XX XXX XXX
Prebooking IDs: abc123, def456
Total Amount: $49.99
================================================================================
EMAIL HTML CONTENT:
================================================================================
[Full HTML email content will be displayed here]
================================================================================
```

### 2. **Check Browser Console Logs**

Open your browser's Developer Tools (F12) and check the **Console** tab. You should see:

```
Sending confirmation email to: customer@example.com
Confirmation email sent successfully: {success: true, message: "Confirmation email sent successfully"}
```

### 3. **Where Email is Triggered**

The email is sent automatically after:
- ✅ Payment is successful
- ✅ Prebookings are confirmed (status changed to 'CONFIRMED')
- ✅ For prebookings-only checkout: Immediately after payment
- ✅ For orders with items: After final submission in Step 3

### 4. **Testing Steps**

1. **Complete a test checkout:**
   - Add items to cart or select prebookings
   - Fill in contact information (email, name, phone)
   - Fill in address information
   - Complete payment with a test card (e.g., `4242 4242 4242 4242`)

2. **Watch the console:**
   - **Server console**: Look for the email log with full HTML content
   - **Browser console**: Look for "Sending confirmation email" and "Confirmation email sent successfully"

3. **Verify the email data:**
   - Check that the email address is correct
   - Verify all prebooking details are included
   - Confirm the total amount is correct

### 5. **Setting Up Real Email Sending**

To send actual emails (instead of just logging), you need to integrate an email service. Here are popular options:

#### Option A: Resend (Recommended - Easy Setup)

1. **Install Resend:**
   ```bash
   npm install resend
   ```

2. **Get API Key:**
   - Sign up at https://resend.com
   - Get your API key from the dashboard

3. **Add to `.env.local`:**
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   FROM_EMAIL=noreply@yourdomain.com
   ```

4. **Update `app/api/orders/send-confirmation/route.ts`:**
   ```typescript
   import { Resend } from 'resend'
   
   const resend = new Resend(process.env.RESEND_API_KEY)
   
   // Replace the console.log section with:
   const { data, error } = await resend.emails.send({
     from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
     to: email,
     subject: 'Order Confirmation',
     html: emailHtml,
   })
   
   if (error) {
     console.error('Error sending email:', error)
     return NextResponse.json(
       { error: 'Failed to send confirmation email' },
       { status: 500 }
     )
   }
   
   console.log('Email sent successfully:', data)
   ```

#### Option B: SendGrid

1. **Install SendGrid:**
   ```bash
   npm install @sendgrid/mail
   ```

2. **Get API Key:**
   - Sign up at https://sendgrid.com
   - Get your API key from Settings > API Keys

3. **Add to `.env.local`:**
   ```
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   FROM_EMAIL=noreply@yourdomain.com
   ```

4. **Update the route:**
   ```typescript
   import sgMail from '@sendgrid/mail'
   
   sgMail.setApiKey(process.env.SENDGRID_API_KEY!)
   
   await sgMail.send({
     to: email,
     from: process.env.FROM_EMAIL!,
     subject: 'Order Confirmation',
     html: emailHtml,
   })
   ```

#### Option C: Nodemailer (SMTP)

1. **Install Nodemailer:**
   ```bash
   npm install nodemailer
   ```

2. **Add SMTP config to `.env.local`:**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   FROM_EMAIL=your-email@gmail.com
   ```

3. **Update the route:**
   ```typescript
   import nodemailer from 'nodemailer'
   
   const transporter = nodemailer.createTransport({
     host: process.env.SMTP_HOST,
     port: parseInt(process.env.SMTP_PORT || '587'),
     secure: false,
     auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASS,
     },
   })
   
   await transporter.sendMail({
     from: process.env.FROM_EMAIL,
     to: email,
     subject: 'Order Confirmation',
     html: emailHtml,
   })
   ```

### 6. **Email Content Structure**

The email includes:
- ✅ Customer name and contact information
- ✅ Order ID (if applicable)
- ✅ Prebooking details (Event name, guest count, total)
- ✅ Order items (if applicable)
- ✅ Delivery information (if applicable)
- ✅ Total amount paid
- ✅ Professional HTML formatting

### 7. **Troubleshooting**

**If you don't see email logs:**
- Check that payment was successful
- Verify prebookings were confirmed
- Check browser console for errors
- Check server console for errors

**If email service integration fails:**
- Verify API keys are correct
- Check email service dashboard for errors
- Ensure "from" email is verified in your email service
- Check spam folder if emails are sent but not received

### 8. **Current Status**

✅ Email content is generated correctly
✅ Email is triggered after successful payment
✅ Email includes all necessary information
⏳ Real email sending needs to be integrated (currently logging only)

---

**Need help?** Check the server console logs first - they show exactly what email would be sent!




