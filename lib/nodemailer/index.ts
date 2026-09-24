import nodemailer from 'nodemailer';
import {
    WELCOME_EMAIL_TEMPLATE,
    NEWS_SUMMARY_EMAIL_TEMPLATE,
    STOCK_ALERT_UPPER_EMAIL_TEMPLATE,
    STOCK_ALERT_LOWER_EMAIL_TEMPLATE,
    VOLUME_ALERT_EMAIL_TEMPLATE,
} from "@/lib/nodemailer/templates";

export type PriceAlertEmailData = {
    email: string;
    symbol: string;
    company: string;
    currentPrice: string;
    targetPrice: string;
    timestamp: string;
};

export type VolumeAlertEmailData = {
    email: string;
    symbol: string;
    company: string;
    currentVolume: string;
    averageVolume: string;
    volumeSpike: string;
    currentPrice: string;
    changePercent: string;
    changeDirection: string;
    priceColor: string;
    alertMessage: string;
    timestamp: string;
};

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL!,
        pass: process.env.NODEMAILER_PASSWORD!,
    }
})

/** App origin for email CTAs/footers. Prefer BETTER_AUTH_URL, then NEXT_PUBLIC_BASE_URL. */
const APP_URL =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'http://localhost:3000';

const SETTINGS_URL = `${APP_URL.replace(/\/$/, '')}/settings`;

const FROM_ADDRESS = process.env.NODEMAILER_EMAIL!;

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace('{{name}}', name)
        .replace('{{intro}}', intro)
        .replaceAll('{{appUrl}}', APP_URL)
        .replaceAll('{{settingsUrl}}', SETTINGS_URL);

    const mailOptions = {
        from: `"TradePilot" <${FROM_ADDRESS}>`,
        to: email,
        subject: `Welcome to TradePilot - your stock market toolkit is ready!`,
        text: 'Thanks for joining TradePilot',
        html: htmlTemplate,
    }

    await transporter.sendMail(mailOptions);
}

export const sendNewsSummaryEmail = async (
    { email, date, newsContent }: { email: string; date: string; newsContent: string }
): Promise<void> => {
    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
        .replace('{{date}}', date)
        .replace('{{newsContent}}', newsContent)
        .replaceAll('{{appUrl}}', APP_URL)
        .replaceAll('{{settingsUrl}}', SETTINGS_URL);

    const mailOptions = {
        from: `"TradePilot News" <${FROM_ADDRESS}>`,
        to: email,
        subject: `📈 Market News Summary Today - ${date}`,
        text: `Today's market news summary from TradePilot`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};

function fillPriceAlertTemplate(template: string, data: PriceAlertEmailData): string {
    return template
        .replaceAll('{{symbol}}', data.symbol)
        .replaceAll('{{company}}', data.company)
        .replaceAll('{{currentPrice}}', data.currentPrice)
        .replaceAll('{{targetPrice}}', data.targetPrice)
        .replaceAll('{{timestamp}}', data.timestamp)
        .replaceAll('{{appUrl}}', APP_URL)
        .replaceAll('{{settingsUrl}}', SETTINGS_URL);
}

export const sendUpperPriceAlertEmail = async (data: PriceAlertEmailData): Promise<void> => {
    const htmlTemplate = fillPriceAlertTemplate(STOCK_ALERT_UPPER_EMAIL_TEMPLATE, data);

    await transporter.sendMail({
        from: `"TradePilot" <${FROM_ADDRESS}>`,
        to: data.email,
        subject: `Price Alert: ${data.symbol} hit your upper target`,
        text: `${data.symbol} (${data.company}) is at ${data.currentPrice}, at or above your target of ${data.targetPrice}.`,
        html: htmlTemplate,
    });
};

export const sendLowerPriceAlertEmail = async (data: PriceAlertEmailData): Promise<void> => {
    const htmlTemplate = fillPriceAlertTemplate(STOCK_ALERT_LOWER_EMAIL_TEMPLATE, data);

    await transporter.sendMail({
        from: `"TradePilot" <${FROM_ADDRESS}>`,
        to: data.email,
        subject: `Price Alert: ${data.symbol} hit your lower target`,
        text: `${data.symbol} (${data.company}) is at ${data.currentPrice}, at or below your target of ${data.targetPrice}.`,
        html: htmlTemplate,
    });
};

function fillVolumeAlertTemplate(template: string, data: VolumeAlertEmailData): string {
    return template
        .replaceAll('{{symbol}}', data.symbol)
        .replaceAll('{{company}}', data.company)
        .replaceAll('{{currentVolume}}', data.currentVolume)
        .replaceAll('{{averageVolume}}', data.averageVolume)
        .replaceAll('{{volumeSpike}}', data.volumeSpike)
        .replaceAll('{{currentPrice}}', data.currentPrice)
        .replaceAll('{{changePercent}}', data.changePercent)
        .replaceAll('{{changeDirection}}', data.changeDirection)
        .replaceAll('{{priceColor}}', data.priceColor)
        .replaceAll('{{alertMessage}}', data.alertMessage)
        .replaceAll('{{timestamp}}', data.timestamp)
        .replaceAll('{{appUrl}}', APP_URL)
        .replaceAll('{{settingsUrl}}', SETTINGS_URL);
}

export const sendVolumeAlertEmail = async (data: VolumeAlertEmailData): Promise<void> => {
    const htmlTemplate = fillVolumeAlertTemplate(VOLUME_ALERT_EMAIL_TEMPLATE, data);

    await transporter.sendMail({
        from: `"TradePilot" <${FROM_ADDRESS}>`,
        to: data.email,
        subject: `Volume Alert: ${data.symbol} is trading at ${data.volumeSpike} average volume`,
        text: `${data.symbol} (${data.company}) volume is ${data.volumeSpike} its 10-day average (${data.currentVolume}M vs ${data.averageVolume}M).`,
        html: htmlTemplate,
    });
};
