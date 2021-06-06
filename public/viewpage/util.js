import * as Element from './element.js'
import * as Constant from '../model/constant.js'
export function popupInfo(title, body, modal) {
    if(modal){
        $('#' + modal).modal('hide')
    }

    Element.popupInfoTitle.innerHTML = title
    Element.popupInfoBody.innerHTML = body
    $('#' + Constant.iDmodalPopupInfo).modal('show')

}
