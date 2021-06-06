// @ts-nocheck
import * as Element from '../viewpage/element.js'
import * as Routes from '../controller/routes.js'
import * as Auth from '../controller/auth.js'
import * as Constant from '../model/constant.js'
import {
    Thread
} from '../model/thread.js'
import * as FirebaseController from '../controller/firebase_controller.js'
import * as Util from './util.js'


export function addEventListeners() {
    Element.menuHome.addEventListener('click', () => {
        history.pushState(null, null, Routes.routePath.HOME)
        home_page()
    })
    Element.formCreateThread.addEventListener('submit', async e => {
        e.preventDefault()
        const uid = Auth.currentUser.uid
        const email = Auth.currentUser.email
        const timestamp = Date.now()
        const title = Element.formCreateThread.title.value
        const content = Element.formCreateThread.content.value
        const keywords = Element.formCreateThread.keywords.value
        const keywordsArray = keywords.toLowerCase().match(/\S+/g)
        const thread = new Thread({
            uid,
            email,
            title,
            timestamp,
            content,
            keywordsArray
        })
        try {
            const docId = await FirebaseController.addThread(thread)
            thread.docId = docId
            home_page() //we will improve later
            Util.popupInfo('Success', 'A new thread has been added', Constant.iDmodalCreateNewThread)
        } catch (e) {
            console.log(e)
        }
    })
}

export async function home_page() {
    let html = '';
    if (!Auth.currentUser) {
        html += '<h1>Protected Page</>'
        return
    }

    html += `
            <button class="btn btn-danger mb-2" data-toggle="modal" data-target="#${Constant.iDmodalCreateNewThread}">+ New Thread </button>
        `
    let threadList
    try {
        threadList = await FirebaseController.getThreadlist()
    } catch (e) {
        console.log(e)
    }

    html += `
    <table class="table table-striped">
    <thead>
      <tr>
        <th scope="col">Action</th>
        <th scope="col">Title</th>
        <th scope="col">KeyWords</th>
        <th scope="col">Posted By</th>
        <th scope="col">Content</th>
        <th scope="col">Posted At</th>
      </tr>
    </thead>
    <tbody>
    `

    threadList.forEach(thread => {
        html += buildThreadView(thread)
    })

    html += `
        </tbody></table>
    `
    Element.mainContent.innerHTML = html
}

function buildThreadView(thread) {
    return `
        <tr>
            <td>View</td>
            <td>${thread.title}</td>
            <td>${thread.keywordsArray.join('')}</td>
            <td>${thread.email}</td>
            <td>${thread.content}</td>
            <td>${new Date(thread.timestamp).toString()}</td>
        </tr>
    `
}