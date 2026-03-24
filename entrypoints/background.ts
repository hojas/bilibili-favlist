export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id })

  browser.action.onClicked.addListener(() => {
    browser.tabs.create({
      url: browser.runtime.getURL('/favlist.html'),
    })
  })
})
