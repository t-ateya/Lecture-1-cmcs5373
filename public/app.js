import * as Auth from "./controller/auth.js";
import * as Home from "./viewpage/home_page.js";
import * as About from "./viewpage/about_page.js";
import * as Routes from './controller/routes.js'



Auth.addEventListeners();
Home.addEventListeners();
About.addEventListeners();

window.onload = () => {
  const pathname = window.location.pathname;
  const href = window.location.href;

  //if (pathname == "/") Home.home_page()
  //else if (pathname == '/about') About.about_page()
  Routes.routing(pathname, href)

}

window.addEventListener('popstate', e =>{
  e.preventDefault()
  const pathname = e.target.location.pathname
  const href = e.target.location.href
  Routes.routing(pathname, href)

})
