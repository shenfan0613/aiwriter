const axios = require('axios')
let Airtable = require('airtable');
let base = new Airtable({apiKey: 'keyVDFnHwMynxFqLv'}).base('appNzuUysRFnMK56E');
const USAGE_LIMIT = 2;


const AIRTABLE_BASE_ID = "appNzuUysRFnMK56E"
const AIRTABLE_API_KEY = "keyVDFnHwMynxFqLv"
let airtableName = "Input"
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

const FORM_URL = "https://aiwriter.pages.dev/"
const RESULT_URL = "https://aiwriter.pages.dev/result"
const FAIL_URL = "https://aiwriter.pages.dev/fail"
const useCaseJobDescriptionId = '60586b31cdebbb000c21058d'
const languageIdEnglish = '607adac76f8fe5000c1e636d'
const toneIdConvincing = '60572a639bdd4272b8fe358b'
const RYTE_API_KEY = 'QHPVUE6PN9JZOBEDLRVQH'
const RYTE_API_URL = 'https://api.rytr.me/v1'



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
    const {
        userId,
        jobType,
    } = Object.fromEntries(body)

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
    //console.log(reqBody)
    let usage = 0;
    let exist = await checkAccount({userId:userId})
    let currentDate = + new Date()
    //console.log("current timestamp" + currentDate)
    let lastUpdate = await checkLastUpdate({userIP:userIP})
    let dateDiff = currentDate - lastUpdate
    //console.log(Date.parse(lastUpdate))
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
        await incrementUsage({userId:userId})
        //await setUsage({userId:userId, usage:1000})

        //await ryte({userId:userId,jobTitle:jobType})
        await createAirtableRecord({body:reqBody,tableName:"Input"})
    }else{
        return Response.redirect(FAIL_URL)
    }
    return Response.redirect(RESULT_URL)
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


// ryte
async function ryte({userId, jobTitle}) {
    const reqBody = {
            'languageId': languageIdEnglish,
            'toneId': toneIdConvincing,
            'useCaseId':useCaseJobDescriptionId,
            'inputContexts': {"JOB_ROLE_LABEL": jobTitle},
            'variations': 1,
            'userId': userId,
            'format': 'text',
    }
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
        }
    }
    await createAirtableRecord ({body:reqBody2,tableName:"paragragh"})

    return null

}
// (async () => {
//     let data = await useCaseDetailById(useCaseJobDescriptionId)
//     console.log(data)
// })()
