let res = fetch('https://api.airtable.com/v0/appNzuUysRFnMK56E/paragragh/recxVGRmwfazKNXdW', {
    headers: {
        'Authorization': 'Bearer keyVDFnHwMynxFqLv'
    }
});
//let result = res.json()
console.log(res.body)
//document.getElementById("result").innerHTML = result