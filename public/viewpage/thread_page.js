import * as Auth from '../controller/auth.js'
import * as Element from '../viewpage/element.js'
import * as FirebaseController from '../controller/firebase_controller.js'
import * as Constant from '../model/constant.js'
import * as Util from '../viewpage/util.js'
import { Message } from '../model/message.js'
import * as Routes from '../controller/routes.js'

export function addThreadViewEvents() {
    const viewForms = document.getElementsByClassName('thread-view-form')
    for (let n=0; n <viewForms.length; n++) {
        addThreadFormEvent(viewForms[n])
    }
}

export function addThreadFormEvent(form) {
    form.addEventListener('submit' , async e=> {
        e.preventDefault()
        const button = e.target.getElementsByTagName('button')[0]
        const label = Util.disableButton(button)
        const threadId = e.target.threadId.value
        history.pushState(null,null,Routes.routePath.THREAD + '#' + threadId)
        thread_page(threadId)
        //await Util.sleep(1000)
        Util.enableButton(button,label)
    })

}

export async function thread_page(threadId) {
    if (!Auth.currentUser) {
        Element.mainContent.innerHTML = '<h1>Protected Page</h1>'
        return 
    }

    if (!threadId) {
        Util.popupInfo('Error','Invalid access to thread')
        return
    }

    // 1. get thread from Firestore by threadId
    // 2. get all reply messages to this thread from Firestore 
    // 3. display this thread
    // 4. display all reply message
    // 5. a form to add a new reply
    
    let thread
    let messages
    try {
        thread = await FirebaseController.getOneThread(threadId)
        if (!thread) {
            Util.popupInfo('Error','Thread does not exist')
            return
        }
        messages = await FirebaseController.getMessageList(threadId)
    } catch (e) {
        if (Constant.DEV) console.log(e)
        Util.popupInfo('Error',JSON.stringify(e))
        return
    }
    
    let html = `
        <h4 class = "bg-primary text-white">${thread.title}</h4>
        <div>${thread.email} (At ${ new Date(thread.timestamp).toString()})</div>
        <div class ="bg-secondary text-white">${thread.content} </div>
        <hr>
    `;

    html += '<div id = "message-reply-body">'
        // display all reply message
        if (messages && messages.length>0) {
            messages.forEach(m=> {
                html += buildMessageView(m)
            })
        }

    html += '</div>'

    // add new reply message
    html += `
        <div>
            <textarea id = "textarea-add-new-message" placeholder="Reply to this message"></textarea>
            <br>
            <button id="button-add-new-message" class ="btn btn-outline-info">Post message</button>
        </div>
    
    `

    Element.mainContent.innerHTML = html

    document.getElementById('button-add-new-message').addEventListener('click', async () => {
        const content = document.getElementById('textarea-add-new-message').value
        const uid = Auth.currentUser.uid
        const email = Auth.currentUser.email
        const timestamp = Date.now()
        const m = new Message({
            uid, email, timestamp, content, threadId
        })

        const button = document.getElementById('button-add-new-message')
        const label = Util.disableButton(button)

        try {
           const docId =  FirebaseController.addMessage(m)
           m.docId = docId
        } catch (e) {
            if (Constant.DEV) console.log(e)
            Util.popupInfo('Error',JSON.stringify(e))
        }

        const mTag = document.createElement('div')
        mTag.innerHTML = buildMessageView(m)
        document.getElementById('message-reply-body').appendChild(mTag)

        document.getElementById('textarea-add-new-message').value = ''

        Util.enableButton(button,label)
    })
}

function buildMessageView(message) {
    return `
        <div class = "border border-primary">
            <div class="bg-info text-white">
                Replied by ${message.email} (At ${new Date(message.timestamp).toString()})
            </div>
            ${message.content}
        </div>
        <hr>
    `
}