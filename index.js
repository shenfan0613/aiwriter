const axios = require('axios')
let Airtable = require('airtable');
let base = new Airtable({apiKey: 'keyVDFnHwMynxFqLv'}).base('appNzuUysRFnMK56E');
const USAGE_LIMIT = 4;


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

    return Response.redirect(RESULT_URL)
}
const submitHandler = async request => {
    if (request.method !== "POST") {
        return new Response("Method Not Allowed", {
            status: 405
        })
    }

    const body = await request.formData();
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
    //console.log(reqBody)
    let usage = await checkUsage({userId:userId})
    if(usage <= USAGE_LIMIT){
        await ryte({userId:userId,jobTitle:jobType})
        await createAirtableRecord({body:reqBody,tableName:"Input"})
    }else{
        return Response.redirect(FAIL_URL)
    }
    return Response.redirect(FORM_URL)
}

async function checkUsage({userId}){
    let response = await fetch('https://api.airtable.com/v0/appNzuUysRFnMK56E/paragragh', {
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
        if(entry.fields.userId == userId){
            count += 1;
        }
    }
    return count;
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
