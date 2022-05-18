// let res = fetch('https://api.airtable.com/v0/appNzuUysRFnMK56E/paragragh/recxVGRmwfazKNXdW', {
//     headers: {
//         'Authorization': 'Bearer keyVDFnHwMynxFqLv'
//     }
// }).then(response => console.log(response.json()));

async function getFields(){
    let response = fetch('https://api.airtable.com/v0/appNzuUysRFnMK56E/paragragh', {
        headers: {
            'Authorization': 'Bearer keyVDFnHwMynxFqLv'
        }
    });
    //console.log(await res.json())
    return (await response).json()
}
(async () => {
    let res = await getFields()
    //let fields = res.json()
    document.getElementById("result").innerHTML = res.records[0].fields.content
    console.log(res.records[0].fields.content)
 })()

//let result = res.json()
//console.log(res.json())
//document.getElementById("result").innerHTML = result