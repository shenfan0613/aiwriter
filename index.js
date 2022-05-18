addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

const FORM_URL = "https://airtable-form-example.pages.dev"

async function handleRequest(request) {
    const url = new URL(request.url)

    if (url.pathname === "/submit") {
        return submitHandler(request)
    }

    return Response.redirect(FORM_URL)
}