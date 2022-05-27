// let res = fetch('https://api.airtable.com/v0/appNzuUysRFnMK56E/paragragh/recxVGRmwfazKNXdW', {
//     headers: {
//         'Authorization': 'Bearer keyVDFnHwMynxFqLv'
//     }
// }).then(response => console.log(response.json()));

async function getFields(){
    let response = fetch('https://api.airtable.com/v0/appNzuUysRFnMK56E/paragragh', {
        headers: {
            'Authorization': 'Bearer keyU4yYu5YxfF8OGY' //read-only key
        }
    });
    //console.log(await res.json())
    return (await response).json()
}
(async () => {

    let res = await getFields()
    res.records.sort(function(a, b) {
        var keyA = new Date(a.createdTime),
            keyB = new Date(b.createdTime);
        // Compare the 2 dates
        if (keyA < keyB) return 1;
        if (keyA > keyB) return -1;
        return 0;
    });
    //let fields = res.json()

    document.getElementById("result").innerHTML = res.records[0].fields.content
    console.log(res.records)
    let inner = "<label for=\"jobType\"> \n" +
        "<input type=\"text\" name=\"jobType\" id=\"jobType\" value=\""+res.records[0].fields.jobType+"\"/>"
    document.getElementById("job").innerHTML = inner
    let inner2 = "<label for=\"recordId\"> \n" +
        "<input type=\"text\" name=\"recordId\" id=\"recordId\" value=\""+res.records[0].id+"\"/>"
    document.getElementById("fieldId").innerHTML = inner2
    document.getElementById("showAll").onclick = function(){foo(res)}
    function foo(res){
        let userId = res.records[0].fields.userId
        let inputId = document.getElementById("userId").value
        if(inputId){
            userId = inputId
        }
        let all = "\n"
        let exist = false
        for (const entry of res.records){
            if(entry.fields.userId == userId){
                all = all+ "<p>" +entry.fields.content +"</p>"
                exist = true
            }
        }
        if(!exist){
            all = all+"NO ENTRY!"
        }
        document.getElementById("result").innerHTML = all
    }
 })()


//let result = res.json()
//console.log(res.json())
//document.getElementById("result").innerHTML = result