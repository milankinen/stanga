appendStylesheets()

// run app
import "./app.js"





/* ADD STYLESHEETS */
function appendStylesheets () {
  const head  = document.getElementsByTagName("head")[0] // eslint-disable-line no-undef

  const styleSheets = [
    createStyleSheet("node_modules/todomvc-common/base.css"),
    createStyleSheet("node_modules/todomvc-app-css/index.css")
  ]
  styleSheets.forEach(link => head.appendChild(link))
}

function createStyleSheet (url) {
  const link  = document.createElement("link") // eslint-disable-line no-undef
  link.rel  = "stylesheet"
  link.type = "text/css"
  link.href = url
  link.media = "all"

  return link
}
