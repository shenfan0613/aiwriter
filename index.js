const USAGE_LIMIT = 2;
//const sgMail = require('@sendgrid/mail')


//const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
console.log(AIRTABLE_API_KEY)
//const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
let airtableName = "Input"
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

const FORM_URL = "https://aiwriter.pages.dev/"
const RESULT_URL = "https://aiwriter.pages.dev/result"
const FAIL_URL = "https://aiwriter.pages.dev/fail"
const useCaseJobDescriptionId = '60586b31cdebbb000c21058d'
const useCaseInterviewQuestionId = '6058693ccdebbb000c210588'
const languageIdEnglish = '607adac76f8fe5000c1e636d'
const toneIdConvincing = '60572a639bdd4272b8fe358b'
//const RYTE_API_KEY = process.env.RYTE_API_KEY
//const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY



async function handleRequest(request) {
    const url = new URL(request.url)
    //console.log(request.formData())
    if (url.pathname === "/submit") {
        return submitHandler(request)
    }

    return Response.redirect(FORM_URL)
}

const submitHandler = async request => {
    if (request.method !== "POST") {
        return new Response("Method Not Allowed", {
            status: 405
        })
    }

    const body = await request.formData();
    const headers = await request.headers;
    const userIP =  headers.get('x-real-ip')
    let ryteId;
    const {
        userId,
        jobType,
        requestType,
        fieldId
    } = Object.fromEntries(body)
    console.log(Object.fromEntries(body))
    //let ryteId;

    // The keys in "fields" are case-sensitive, and
    // should exactly match the field names you set up
    // in your Airtable table, such as "First Name".
    const reqBody = {
        fields: {
            "userId": userId,
            "Job Description": jobType,
        }
    }
    const initialUser = {
        fields:{
            "userIP": userIP,
            'userId': userId,
            "usage": 0
        }
    }
    let usage = 0;
    let exist = await checkAccount({userId:userId})
    let currentDate = + new Date()
    let lastUpdate = await checkLastUpdate({userIP:userIP})
    let dateDiff = currentDate - lastUpdate
    if(dateDiff >= 1500){
       await resetIPUsage({userIP:userIP})
    }
    if(!exist){
        await createAirtableRecord({body:initialUser,tableName:"user"})
    }else{
        usage = await checkUsage({userIP:userIP})
        console.log(usage)
    }
    console.log("time since last update "+ dateDiff)

    //console.log(userId + "used" + usage)
    if(usage < USAGE_LIMIT){
        //await incrementUsage({userId:userId})
        //await setUsage({userId:userId, usage:1000})
        //await sendEmail()
        if (requestType === "jobDescription"){
            ryteId = useCaseJobDescriptionId
            await ryte({userId:userId,jobTitle:jobType,ryteId:ryteId})
        }else if(requestType === "interviewQuestion"){
            ryteId = useCaseInterviewQuestionId
            let text = await ryte({userId:userId,jobTitle:jobType,ryteId:ryteId})
            console.log(await sendEmail({userId:userId, text:text}))
            await updateUserId({userId:userId,fieldId:fieldId})
        }
        //await ryte({userId:userId,jobTitle:jobType,ryteId:ryteId})
        //await createAirtableRecord({body:reqBody,tableName:"Input"})
    }else{
        return Response.redirect(FAIL_URL)
    }
    return Response.redirect(RESULT_URL)
}
async function sendEmail({userId,text}){

    let reqBody = {
        'personalizations': [
            {
                'to': [
                    {
                        'email': `${userId}`
                    }
                ]
            }
        ],
        'from': {
            'email': 'shenfansj@gmail.com'
        },
        'subject': 'Interview Question Samples',
        'content': [
            {
                'type': 'text/plain',
                'value': `${text}`
            }
        ]
    }
    console.log(JSON.stringify(reqBody))
    return await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
        },
        // body: '{"personalizations": [{"to": [{"email": "test@example.com"}]}],"from": {"email": "test@example.com"},"subject": "Sending with SendGrid is Fun","content": [{"type": "text/plain", "value": "and easy to do anywhere, even with cURL"}]}',
        body: JSON.stringify(
            reqBody
        )
    });
}
async function checkUsage({userIP}){
    let response = await fetch('https://api.airtable.com/v0/appNzuUysRFnMK56E/user', {
        method:'GET',
        headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-type': `application/json`
        }
    });
    //console.log(await response.json())
    let res = await response.json()
    let records = res.records
    let count = 0;
    //console.log(res)
    for (const entry of records){
        if(entry.fields.userIP === userIP){
            count = count + entry.fields.usage;
        }
    }
    return count;
}

async function checkAccount({userId}){
    let response = await fetch('https://api.airtable.com/v0/appNzuUysRFnMK56E/user', {
        method:'GET',
        headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-type': `application/json`
        }
    });
    //console.log(await response.json())
    let res = await response.json()
    let records = res.records
    let exist = false;
    //console.log(res)
    for (const entry of records){
        if(entry.fields.userId === userId){
            exist = true;
        }
    }
    return exist;
}

async function checkLastUpdate({userIP}){
    let response = await fetch('https://api.airtable.com/v0/appNzuUysRFnMK56E/user', {
        method:'GET',
        headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-type': `application/json`
        }
    });
    //console.log(await response.json())
    let res = await response.json()
    let records = res.records
    let date = 0;
    //console.log(res)
    for (const entry of records){
        if(entry.fields.userIP === userIP){
            if(date < Date.parse(entry.fields.lastUpdate)){
                date = Date.parse(entry.fields.lastUpdate)
            }

        }
    }
    return date;
}

async function getFieldId({userId}){
    let response = await fetch('https://api.airtable.com/v0/appNzuUysRFnMK56E/user', {
        method:'GET',
        headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-type': `application/json`
        }
    });
    //console.log(await response.json())
    let res = await response.json()
    let records = res.records
    let id
    //console.log(res)
    for (const entry of records){
        if(entry.fields.userId === userId){
            id = entry.id
        }
    }
    return id;
}

async function resetIPUsage({userIP}){
    let response = await fetch('https://api.airtable.com/v0/appNzuUysRFnMK56E/user', {
        method:'GET',
        headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-type': `application/json`
        }
    });
    //console.log(await response.json())
    let res = await response.json()
    let records = res.records
    //console.log(res)
    for (const entry of records){
        if(entry.fields.userIP === userIP){
            let id = entry.id
            let userId = entry.fields.userId
            await setUsage({userId:userId, usage: 0})
        }
    }
    return response;
}
async function incrementUsage({userId}){
    let tableName = "user"
    let currentUsage = await checkUsage({userId})
    let id = await getFieldId({userId})
    let reqBody = {
        'records': [
            {
                'id': id,
                'fields': {
                    'userId': userId,
                    'usage': currentUsage +=1
                }
            }
        ]
    }
    return await patchAirtableRecord({body:reqBody, tableName: tableName})
}

async function setUsage({userId,usage}){
    let tableName = "user"
    let id = await getFieldId({userId})
    let reqBody = {
        'records': [
            {
                'id': id,
                'fields': {
                    'userId': userId,
                    'usage': usage
                }
            }
        ]
    }
    console.log("set user " + userId + " usage to " + usage)
    return await patchAirtableRecord({body:reqBody, tableName: tableName})
}

async function createAirtableRecord ({body,tableName}) {
    //console.log(JSON.stringify(body))
    return fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-type': `application/json`
        }
    })
}
async function patchAirtableRecord ({body,tableName}) {
    //console.log("patch body:" + JSON.stringify(body))
    return fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-type': `application/json`
        }
    })
}
async function updateUserId ({userId:userId,fieldId:fieldId}) {

    let reqBody = {
        'records': [
            {
                'id': fieldId,
                'fields': {
                    'userId': userId,
                }
            }
        ]
    }
    console.log("patch body:" + JSON.stringify(reqBody))
    return patchAirtableRecord({body:reqBody,tableName:"paragragh"})
}

``// ryte
async function ryte({userId, jobTitle, ryteId}) {
    let input
    if(ryteId === useCaseJobDescriptionId){
        input = {"JOB_ROLE_LABEL": jobTitle}
    }else{
        input = {"INTERVIEWEE_BIO_LABEL": "John Doe is a person","INTERVIEW_CONTEXT_LABEL": "Interviewing a candidate for the role of " + jobTitle}
    }
    const reqBody = {
            'languageId': languageIdEnglish,
            'toneId': toneIdConvincing,
            'useCaseId':ryteId,
            'inputContexts': input,
            'variations': 1,
            'userId': userId,
            'format': 'text',
    }
    console.log(JSON.stringify(reqBody))
    let response = await fetch(`https://api.rytr.me/v1/ryte`, {
        method: 'POST',
        headers: {
            'Authentication': `Bearer ${RYTE_API_KEY}`,
            'Content-type': `application/json`
        },
        body:JSON.stringify(reqBody)
    })
    let data1 = await response.json()
    console.log(data1.data[0].text)
    const reqBody2 = {
        fields: {
            "userId": userId,
            "content": data1.data[0].text,
            "jobType": jobTitle
        }
    }
    if(ryteId === useCaseJobDescriptionId){
        await createAirtableRecord ({body:reqBody2,tableName:"paragragh"})
    }else if (ryteId === useCaseInterviewQuestionId){

        await createAirtableRecord({body:reqBody2,tableName:"interview"})
    }


    return data1.data[0].text

}``
// (async () => {
//     let data = await useCaseDetailById(useCaseJobDescriptionId)
//     console.log(data)
// })()
