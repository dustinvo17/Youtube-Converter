const fs = require('fs')
const Downloader = require('./downloader.js')
const electron = require('electron');
const clipboard = electron.clipboard

const shell = electron.shell
const $ = require("jquery");
let dl_path;

const {
    ipcRenderer
} = electron;
//

// INIT DOWNLOAD PATH 
let searchResults = []
let dl;
$(document).ready(function () {
    ipcRenderer.send('download_path', '')
})

ipcRenderer.on('download_path-reply', function(e, download_path) {
    dl_path = download_path
    dl = new Downloader(download_path, download_callback, finish_download_callback)

})
// listen if user change download directory path in settings
ipcRenderer.on('download-change-repl',function(e,new_download_path){
    dl_path = new_download_path
    dl = new Downloader(new_download_path, download_callback, finish_download_callback)
})
// TRIGGER PASTE BUTTON ON MENU PASTE PRESS OR CMD V
ipcRenderer.on('paste-press', function (e, data) {
    $('.paste-button').trigger('click')
})


// PASTE BUTTON EVENT 
$('.paste-button').click(function (e) {
    e.preventDefault()
    let el = $(this);
    el.prop('disabled', true);
    setTimeout(function () { el.prop('disabled', false); }, 2000)

    let link = clipboard.readText()
    if (!link.includes('www.youtube.com')) {
        alert(`Invalid URL: ${link}! URL must be from Youtube`)
        return
    }

    let isPlaylist = link.includes('playlist?list=')
    let format = $('#format').val()
    if (isPlaylist) {

        if (format === 'mp3') {
            dl.playlistmp3(link)
        }
        else {
            dl.playlistmp4(link)
        }
    }
    else {
        if (format === 'mp3') {
            dl.getmp3(link)
        }
        else {
            dl.getmp4(link)
        }
    }

})



// SUBMIT SEACH QUERY AND RENDER RESULTS
$('.search-input-wrapper').submit(function (e) {
    e.preventDefault()
    $('.search-result-list').empty()
    let query = $('.search-input-value').val()
    if (query.length > 0) {
        searchResults = []
        dl.search(query, searchCallBack)
        let listResult = $("<ul class='search-result-list'><i class='fa fa-window-close'></i> </ul>")
        listResult.appendTo('.input-and-results')
        $('.search-result-list').addClass('while-loading')
        let loadIcon = $("<i class='fa fa-spinner search-loading-icon'></i>")
        loadIcon.appendTo('.search-result-list')
        $('.search-input-value').val('')
        $('html, .fa-window-close').click(function (event) {
            $(listResult).hide()
        })
        $('.search-input-value').click(function (event) {
            event.stopPropagation()
            $(listResult).show()
        })
        $('#format').click(function (event) {
            event.stopPropagation()
        })
        $(listResult).click(function (event) {
            event.stopPropagation()
        })
    }
})



function searchCallBack(info) {

    searchResults = [...info]

    $('.search-result-list').removeClass('while-loading')
    $(".search-loading-icon").remove()

    searchResults.forEach((item, index) => {
        let result = $(`<li class="search-result-item" id="${item.id}">
              <img  src="${item.thumbnail}" >
              <small class="search-result-item-title" style="margin-right:auto;" >${item.title}</small>
              <button class="download-button" type="button" ">Download</button>
          
          </li`)

        $(result).hover(function () {
            result.css('background', '#D3D3D3')
            $(`#${item.id}  .search-loading-icon`).css('color', '#4299e1')
        }, function () {
            result.css('background', 'none')
            $(`#${item.id} .search-loading-icon`).css('color', '#D3D3D3')
        })
        if (index == 0) {
            $('#foo').attr('src', item.url)
        }
        result.appendTo('.search-result-list')

        if ($(`#downloaded-${item.id}-mp4_true`).length || $(`#downloaded-${item.id}-mp4_false`).length) {
            $(`#${item.id} .download-button`).replaceWith('<small>Downloaded</small>')
        }
        else {
            $(`#${item.id} .download-button`).click(function (e) {

                e.preventDefault()
                let format = $('#format').val()
                let url = `https://www.youtube.com/watch?v=${item.id}`
                if (format == 'mp3') {

                    dl.getmp3(url)
                }
                else {
                    dl.getmp4(url)
                }
                $(`#${item.id} .download-button`).replaceWith("<i class='fa fa-spinner search-loading-icon'></i>")

            })

        }



        $(`#${item.id} img , #${item.id} .search-result-item-title`).click(function (e) {
            e.preventDefault()
            shell.openExternal(item.url)


        })


    });
}

// WHEN DOWNLOAD FIRST START
let count = 0;
function download_callback(item, mp4 = false) {

    count++
    console.log(count)

    let filename = mp4 ? item._filename : item.fileName

    let filepath = `${dl_path}/${filename}`
    let downloaded = `<button type="button" class="go-to-file play-button">Play</button>`

    ipcRenderer.send('download-start', filename)
    $(`#${item.id} .search-loading-icon`).replaceWith(downloaded)
    addItemToDownloadedList(item, mp4)
    $(`#${item.id} .play-button , #downloaded-${item.id}-mp4_${mp4} .play-button`).click(function (e) {
        e.preventDefault()
        shell.openPath(filepath)
    })
    $(`#downloaded-${item.id}-mp4_${mp4} .fa-window-close`).click(function (e) {

        $(`#downloaded-${item.id}-mp4_${mp4}`).remove()
    })


}
function addItemToDownloadedList(item, mp4) {

    let downloadedItem = `
      <li class="downloaded-item" id="downloaded-${item.id}-mp4_${mp4}">
        <img  src="${mp4 == true ? item.thumbnail : item.ref.thumbnail.url}" >
        <div class="downloaded-item-info">
          <h4 class="downloaded-item-title">${mp4 == true ? item.title : item.ref.title}</h4>  
          <small>File Type: ${mp4 == true ? 'MP4 - Video' : 'MP3 - Audio'}</small>
        </div>
        <div class="downloaded-item-buttons">
        <button type="button" class="play-button">Play</button>
      </div>
      <i class="fa fa-window-close"></i>
      <div class="processing">
        <i class='fa fa-spinner search-loading-icon'></i>
        <small>Processing ...</small>
      </div>
      </li>
    `
    $(downloadedItem).prependTo('.downloaded-list')



}

// DOWNLOAD FINISH
function finish_download_callback(item, mp4 = false) {
    $(`#downloaded-${item.id}-mp4_${mp4} .processing`).remove()
    let filename = mp4 ? item._filename : item.fileName

    ipcRenderer.send('download-completed', filename)
}


