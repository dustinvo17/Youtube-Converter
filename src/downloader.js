const path = require('path');
const fs = require('fs')
const youtubedl = require('youtube-dl')
const DownloadYTFile = require('yt-dl-playlist')
let dl_path;
let finish_callback;

let callback;

const Downloader = function(download_path,start,finish) {
  
    
    callback = start
    finish_callback = finish
   
    dl_path = download_path
    this.mp3downloader = new DownloadYTFile({ 
        outputPath: download_path,
        ffmpegPath: path.join(__dirname, '../ffmpeg'),
        maxParallelDownload: 50,
        fileNameGenerator: function(videoTitle) {
          return  videoTitle.replace('/', '|') + '.mp3'
        }
    })
      
      this.mp3downloader.on('error', function(fileInfo) {
        console.log(fileInfo.error)
        alert(`There is an error while processing, please try again!`)
        throw fileInfo.error

      })
      this.mp3downloader.on('start', function(fileInfo) {
        callback(fileInfo)
     
      })
      this.mp3downloader.on('complete',function(fileInfo){ finish_callback(fileInfo)})
   
 
};

Downloader.prototype.getmp3 = function(url){
    let self = this
    youtubedl.getInfo(url,function(err,info){
        if(err) {
            console.log(err)
            alert(`There is an error while processing, please try again!`)
            throw err

        }
        self.mp3downloader.download(info.id)
        
    })
    
 
}




Downloader.prototype.getmp4 = function(url) {
    const self = this
    let item;
    const video = youtubedl(url,
  // Optional arguments passed to youtube-dl.

  ['--format=18'],
  // Additional options can be given for calling `child_process.execFile()`.
  { cwd: __dirname })
  let size = 0;
// Will be called when the download starts.
video.on('info', function(info) {
    size = info.size
  console.log('Download started')
  console.log('filename: ' + info._filename)
  console.log('size: ' + info.size)
  item = info
  callback(info,mp4=true)
  video.pipe(fs.createWriteStream(`${dl_path}/${info._filename}`))
})
video.on('error',function error(err) {
    console.log(err)
    alert(`There is an error while processing, please try again! `)
    throw err
})

  video.on('end', function(info) {
        console.log(info)
        finish_callback(item,mp4=true)
  
  })

 
} 
Downloader.prototype.playlistmp4 = function(url) {
    let info_item;
    const video = youtubedl(url)
    const self = this
    video.on('error', function error(err) {
        console.log(err)
        alert(`There is an error while processing, please try again!`)
        throw err
    })
   
    let size = 0
    video.on('info', function(info) {
      size = info.size
      info_item = info
      callback(info,mp4=true)
      video.pipe(fs.createWriteStream(`${dl_path}/${info._filename}`))
    })
 
    let pos = 0
    video.on('data', function data(chunk) {
      pos += chunk.length
      // `size` should not be 0 here.
      if (size) {
        let percent = (pos / size * 100).toFixed(2)
        process.stdout.cursorTo(0)
        process.stdout.clearLine(1)
        process.stdout.write(percent + '%')
        console.log(percent)
      }
    })
    video.on('end',function(e) {
        finish_callback(info_item,mp4=true)
    })
    video.on('next', function(info) {
        Downloader.prototype.playlistmp4(info,callback)
    } )
  }
Downloader.prototype.playlistmp3 = function(url) {
    let self = this
    youtubedl.getInfo(url,function(err,info){
        if(err) return alert(`There is an error while processing, please try again!`)
        
        for(let item of info){
            self.mp3downloader.download(item.id)

        }
        
    })
}


// search return result

Downloader.prototype.search = function(query,searchCallBack) {
   youtubedl.getInfo(`ytsearch5:${query}`,function(err, info) {
        if(err) {
            console.log(err)
            alert(`There is an error while searching, please try again!`)
            throw err
        }
        else{
            searchCallBack(info)
            
        }
    })
}
module.exports = Downloader;
