let res = fetch('https://api.airtable.com/v0/appNzuUysRFnMK56E/paragragh/recxVGRmwfazKNXdW', {
    headers: {
        'Authorization': 'Bearer keyVDFnHwMynxFqLv'
    }
});
let result = res.json()

document.getElementById("result").innerHTML = result