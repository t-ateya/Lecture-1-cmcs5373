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
import * as ThreadPage from './thread_page.js'

export function addEventListeners() {
    Element.menuHome.addEventListener('click', async() => {
        history.pushState(null, null, Routes.routePath.HOME)
        const label = Util.disableButton(Element.menuHome)
        await home_page()
        Util.enableButton(Element.menuHome, label)
    })

    // Event listener for creating a new thread
    Element.formCreateThread.addEventListener('submit', async e => {
        e.preventDefault()
        Element.formCreateThreadError.title.innerHTML = '';
        Element.formCreateThreadError.keywords.innerHTML = '';
        Element.formCreateThreadError.content.innerHTML = '';

        const uid = Auth.currentUser.uid
        const email = Auth.currentUser.email
        const timestamp = Date.now()
        const title = Element.formCreateThread.title.value.trim()
        const content = Element.formCreateThread.content.value.trim()
        const keywords = Element.formCreateThread.keywords.value.trim()
        const keywordsArray = keywords.toLowerCase().match(/\S+/g)
        const thread = new Thread({
                uid,
                email,
                title,
                keywordsArray,
                content,
                timestamp
            })
            // validate threads
        let valid = true;
        let error = thread.validate_title();
        if (error) {
            valid = false;
            Element.formCreateThreadError.title.innerHTML = error;
        }
        error = thread.validate_keywords();
        if (error) {
            valid = false;
            Element.formCreateThreadError.keywords.innerHTML = error;
        }
        error = thread.validate_content();
        if (error) {
            valid = false;
            Element.formCreateThreadError.content.innerHTML = error;
        }

        if (!valid) {
            return;
        }
        try {
            const docId = await FirebaseController.addThread(thread)
            const button = Element.formCreateThread.getElementsByTagName('button')[0]
            const label = Util.disableButton(button)
            thread.docId = docId
            const trTag = document.createElement('tr')
            trTag.innerHTML = buildThreadView(thread)
            const threadBodyTag = document.getElementById('thread-body-tag')
            threadBodyTag.prepend(trTag)
            const threadForms = document.getElementsByClassName('thread-view-form');
            ThreadPage.addThreadFormEvent(threadForms[0]);
            Element.formCreateThread.reset()
            Util.popupInfo('Success', 'A new thread has been added', Constant.iDmodalCreateNewThread)
        } catch (e) {
            if (Constant.DEV) console.log(e)
            Util.popupInfo('Failed to add', JSON.stringify(e), Constant.iDmodalCreateNewThread)
        }
        home_page()
        Util.enableButton(button, label)
    })
}

export async function home_page() {
    if (!Auth.currentUser) {
        Element.mainContent.innerHTML = '<h1>Protected Page</h1>'
        return
    }

    let threadList
    try {
        threadList = await FirebaseController.getThreadList()
    } catch (e) {
        if (Constant.DEV) console.log(e)
        Util.popupInfo('Error to get Threads', JSON.stringify(e))
        return
    }
    buildHomeScreen(threadList, true)

    // Implementing delete button
    if (document.getElementById('button-delete-thread') != null) {
        document.getElementById('button-delete-thread').addEventListener('click', async => {
            const threadId = document.getElementById('delete-threadId').value
                //console.log(threadId)
            const button = document.getElementById('button-delete-thread')
            const label = Util.disableButton(button)
            try {
                FirebaseController.deleteThread(threadId)
                FirebaseController.deleteThreadMessage(threadId)

            } catch (e) {
                if (Constant.DEV) console.log(e)
                Util.popupInfo('Error', JSON.stringify(e))
            }
            home_page()
            Util.enableButton(button, label)
        })
    }
}

export function buildHomeScreen(threadList, newButton) {

    let html = ''
    if (newButton) {
        html = `
        <button class="btn btn-outline-danger mb-3" data-toggle="modal" data-target="#${Constant.iDmodalCreateNewThread}">+New Thread</button>
        `
    }

    html += `
    <table class="table table-striped">
  <thead>
    <tr>
      <th scope="col">Action</th>
      <th scope="col"></th>
      <th scope="col">Title</th>
      <th scope="col">Keywords</th>
      <th scope="col">Posted By</th>
      <th scope="col">Content</th>
      <th scope="col">Posted At</th>
    </tr>
  </thead>
  <tbody id="thread-body-tag">
    `

    threadList.forEach(thread => {
        html += '<tr>' + buildThreadView(thread) + '</tr>'
    })
    html += `
        </tbody></table>
    `

    if (threadList.length == 0) {
        html += '<h4>No Threads Found!</h4>'
    }

    Element.mainContent.innerHTML = html

    ThreadPage.addThreadViewEvents()
}

function buildThreadView(thread) {
    if (thread.email == Auth.currentUser.email) {
        return `        
            <td>
                <form method = "post" class="thread-view-form">
                    <input type="hidden" name="threadId" value="${thread.docId}">
                    <button type="submit" class ="btn btn-outline-primary">View</button>
                </form>
            </td>  
                      
            <td>
            <div>
            <input type="hidden" name="delete-threadId" id="delete-threadId" value="${thread.docId}">
            <button id="button-delete-thread" class="btn btn-outline-danger"}">Delete</button>
            </div>
            </td>                 
            <td>${thread.title}</td>
            <td>${!thread.keywordsArray || !Array.isArray(thread.keywordsArray) ? '' : thread.keywordsArray.join(' ')}</td>
            <td>${thread.email}</td>
            <td>${thread.content}</td>
            <td>${new Date(thread.timestamp).toString()}</td>
                    
    `
    } else {
        return `        
            <td>
                <form method = "post" class="thread-view-form">
                    <input type="hidden" name="threadId" value="${thread.docId}">
                    <button type="submit" class ="btn btn-outline-primary">View</button>
                </form>
            </td>  
                      
            <td>
            <button disabled class="btn btn-outline-danger" data-toggle="modal" data-target="#${Constant.iDmodalDeleteForm}">Delete</button>
            </td>                 
            <td>${thread.title}</td>
            <td>${!thread.keywordsArray || !Array.isArray(thread.keywordsArray) ? '' : thread.keywordsArray.join(' ')}</td>
            <td>${thread.email}</td>
            <td>${thread.content}</td>
            <td>${new Date(thread.timestamp).toString()}</td>
                    
    `
    }
}