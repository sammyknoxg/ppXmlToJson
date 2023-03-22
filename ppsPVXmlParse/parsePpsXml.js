const fs = require('fs')
const cheerio = require('cheerio')

/**
 * node parsePpsXml.js
**/

async function parseXml() {
  let ppsFormsArr = []
  let craftNamesArr = []
  let xmlFilePathArr = []
  let xmlFileNamesArr = []
  var isTaskSeqQuestion = false

  let craftDirs = await fs.readdirSync('./pps_xml/')

  for await (const dir of craftDirs) {  
    let xmlFiles = await fs.readdirSync('./pps_xml/'+dir+'/')
    for await (const xmlFile of xmlFiles) {  
      let xmlPath = './pps_xml/'+dir+'/'+xmlFile
      xmlFileNamesArr.push(xmlFile)
      xmlFilePathArr.push(xmlPath)
      craftNamesArr.push(dir)
    }
  }
  //console.log(craftNamesArr)

  for await (const [i, xmlFilePath] of xmlFilePathArr.entries()) {
    let xmlFile = xmlFileNamesArr[i]
    if (xmlFile != '.DS_Store') {
      //console.log(xmlFilePath)
      let xmlData = await fs.readFileSync(xmlFilePath)
      const $ = cheerio.load(xmlData, {
        xml: {
          normalizeWhitespace: true,
          xmlMode: true
        },
      })

      
      let fileName = xmlFile.split('.')
      let ppsTopic = fileName[0]
      let tableID = ppsTopic.replace('PPS_topic_', 'PPS_table_')
      let hasPPS = $('section').attr('outputclass') == 'blankPPS' ? false : true

      if (hasPPS) {
        let craft = $('body section').first().find('p:nth-child(1) > ph:nth-child(2)').text()
        let module = $('body section').first().find('p:nth-child(2) > ph:nth-child(2)').text()
        let moduleTitle = $('body section').first().find('p:nth-child(3) > ph:nth-child(2)').text()
        //console.log(module)

        let objectives = []
        let tasks = []
        var tasksList = []

        //if (ppsTopic == 'PPS_topic_07201') {
        let rows = $('table').find('tbody > row > entry').toArray()
        let arrayLen = rows.length
        for await (const [i, item] of rows.entries()) {
        //$('table').find('tbody > row > entry').each((i, item) => {
          
          
            //console.log($(item).parent('row').next().find('entry > ul > li').text().trim())
          
          let nextTask = $(item).next().text().trim()
          let nextTaskSequence = $(item).parent('row').next().find('entry > ul > li').text().trim()
            
          let task = $(item).text().trim()
          let task1 = task.replace(/\s{2,}/g, ' ')
          let task2 = task1.split('\n').join('')

          let entryIndex = $(item).index()
          let taskSequence = $(item).parent('row').find('ul > li').text().trim()

          if (entryIndex == 1 && taskSequence.length == 0 && nextTaskSequence.length > 0) {
            if(tasksList.length > 0) {
              tasks.push(tasksList)
              tasksList = []
            }
          }

          isTaskSeqQuestion = false
          if (entryIndex == 1 && tasksList.length == 0 && nextTaskSequence.length > 0) {
            isTaskSeqQuestion = true
          }
          if (task2.endsWith(':')) {
            isTaskSeqQuestion = true
          }

          if (entryIndex == 0 && task2.length > 0) {
            objectives.push(task2)
            //console.log('tasksList == ', tasksList)
          }

          if (task2.length > 1 && entryIndex > 0) {
            
            if (isTaskSeqQuestion || taskSequence.length) {
              if (isTaskSeqQuestion) {
                // end of prev tasklist, and start of new one
                if(tasksList.length > 0) {
                  tasks.push(tasksList)
                  tasksList = []
                }
                //console.log('TaskSeq IS Question == ', task2)
                tasksList.push(task2)
              } else {
                tasksList.push(task2)
              }
              
            } else  {

              // if(tasksList.length > 0) {
              //   tasks.push(tasksList)
              //   tasksList = []
              // }
              tasks.push(task2)
                console.log('TaskSeq NOT Question == ', )
            }

          }
          if (i == arrayLen-1) {
            if(tasksList.length > 0) {
              tasks.push(tasksList)
              tasksList = []
            }
            tasksList = []
          }
        //})
        }  

        let testObj = {
          craft: craft,
          module: module,
          moduleTitle: moduleTitle,
          source: craftNamesArr[i]+'/'+ppsTopic+'.xml',
          objectives: objectives,
          tasks: tasks,
          tcount: tasks.length,
          ocount: objectives.length
        }
        ppsFormsArr.push(testObj)
        
        //}
      } else {
        
      }
    }
  }
  // console.log(ppsFormsArr)
  // console.log(tasksTotal.length)
  // console.log(tasksWithDescriptor.length)

  var logger = fs.createWriteStream('PPS.json', {
      flags: 'w' // 'a' means appending (old data will be preserved)
  })

  logger.on('error', (err) => {
      /* error handling */
  })

  logger.write(JSON.stringify(ppsFormsArr))
  logger.end()
}

parseXml()