const cron = require("node-cron");

let job = {};

const createEmailNotification = (meeting) => {
    const reminder = getReminderDateUtc(meeting.startDate);
    const cronExpr = dateToCronUtc(reminder);   
    job[meeting._id] = cron.schedule(cronExpr, () => {
        const { subject, html } = buildMeetingEmail(meeting, meeting.user.email, meeting.user.email, { appUrl: process.env.DOMAIN, action: 'reminder' });
        sendToListOfUsers(meeting.candidates, subject, html);
    });
};

const deleteEmailNotification = (meeting) => {
    if (!job[meeting._id]) return;
    job[meeting._id].stop();
    delete job[meeting._id];
};

const getReminderDateUtc = (meetingStartUtc) => {
    const start = meetingStartUtc instanceof Date ? meetingStartUtc : new Date(meetingStartUtc);
    if (isNaN(start)) throw new Error('invalid meeting start date');
    return new Date(start.getTime() - 5 * 60 * 1000);
}

const dateToCronUtc = (date) => {
    const m = date.getUTCMinutes();
    const h = date.getUTCHours();
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    return `${m} ${h} ${day} ${month} *`;
}

module.exports = { createEmailNotification, deleteEmailNotification };

    