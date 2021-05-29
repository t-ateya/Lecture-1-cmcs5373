import * as Element from '../viewpage/element.js'
import * as Routes from '../controller/routes.js'
import * as Auth from '../controller/auth.js'
import * as Constant from '../model/constant.js'
import { Thread } from '../model/thread.js'
import * as FirebaseController from '../controller/firebase_controller.js'
import * as Util from './util.js' 
import * as ThreadPage from './thread_page.js'

export function addEventListeners() {

    Element.menuHome.addEventListener('click',async () =>{
            history.pushState(null,null,Routes.routePath.HOME)
            const label = Util.disableButton(Element.menuHome)
            home_page()
            Util.enableButton(Element.menuHome,label)
    })

    // Event listener for creating a new thread
    Element.formCreateThread.addEventListener('submit', async e=> {
        e.preventDefault()
        const button = Element.formCreateThread.getElementsByTagName('button')[0]
        const label = Util.disableButton(button)
        const uid = Auth.currentUser.uid
        const email = Auth.currentUser.email
        const timestamp = Date.now()
        const title = Element.formCreateThread.title.value
        const content = Element.formCreateThread.content.value
        const keywords = Element.formCreateThread.keywords.value
        const keywordsArray = keywords.toLowerCase().match(/\S+/g)
        const thread = new Thread(
            {uid,email,title,keywordsArray,content,timestamp}
        )
        try {
            const docId = await FirebaseController.addThread(thread)
            thread.docId = docId
           // home_page() // we will improve later
           const trTag = document.createElement('tr') 
           trTag.innerHTML = buildThreadView(thread)
           const threadBodyTag = document.getElementById('thread-body-tag')
           threadBodyTag.prepend(trTag)
           const threadForms = document.getElementsByClassName('thread-view-form');
           ThreadPage.addThreadFormEvent(threadForms[0]);
           Element.formCreateThread.reset()

           Util.popupInfo('Success','A new thread has been added',Constant.iDmodalCreateNewThread)
        } catch (e) {
           if(Constant.DEV) console.log(e)
           Util.popupInfo('Failed to add',JSON.stringify(e),Constant.iDmodalCreateNewThread)
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
      if(Constant.DEV)  console.log(e)
      Util.popupInfo('Error to get Threads',JSON.stringify(e))
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
            if(Constant.DEV) console.log(e)
            Util.popupInfo('Error',JSON.stringify(e))
        }
        home_page()
        Util.enableButton(button,label)
    })
    }
}

export function buildHomeScreen(threadList, newButton) {

    let html =''
    if (newButton) {
    html = `
        <center>
        <h4>
        Hello <br/>
        ${Auth.currentUser.email}<br />
        </h4>
        <button class="btn btn-outline-danger" data-toggle="modal" data-target="#${Constant.iDmodalCreateNewThread}">+New Thread</button>
        </center>
        <br />
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
            <td>${thread.keywordsArray.join(' ')}</td>
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
            <td>${thread.keywordsArray.join(' ')}</td>
            <td>${thread.email}</td>
            <td>${thread.content}</td>
            <td>${new Date(thread.timestamp).toString()}</td>
                    
    `  

    } 
}