import * as Element from '../viewpage/element.js'
import * as Routes from '../controller/routes.js'
import * as Auth from '../controller/auth.js'

export function addEventListeners() {
    Element.menuAbout.addEventListener('click',() => {
        history.pushState(null,null, Routes.routePath.ABOUT)
        about_page()
    })
}

export function about_page() {
    if (!Auth.currentUser) {
        Element.mainContent.innerHTML = '<h1>Protected Page</h1>'
        return
    }
    Element.mainContent.innerHTML = '<h1>About Page</h1>'
}