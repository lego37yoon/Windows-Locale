/* eslint-disable unicorn/prevent-abbreviations, array-callback-return */
import { writeFileSync } from 'node:fs'
import PDFParser from 'pdf2json'

const filename = '[MS-LCID].pdf'
const pdfParser = new PDFParser()

console.time('build in')

pdfParser.on('pdfParser_dataError', errData => console.error(errData.parserError))
pdfParser.on('pdfParser_dataReady', pdfData => {
	//          Language | Location | ID      | TAG    | Version
	const x = [4.612, 11.451, 21.677, 25.539, 29.516].reverse()
	const defaultData = {
		language: null,
		location: null,
		id: null,
		tag: null,
		version: null
	}
	const defaultKeys = Object.keys(defaultData).reverse()

	let data = []
	let y // Line
	let check
	let pdf

	// for 16.0, language codes are described between page 31 to 59
	for (let i = 30; i < 59; i++) {
		y = []
		check = false
		pdf = pdfData.formImage.Pages[i].Texts

		pdf = pdf.filter(e => {
			if (e.R && e.R[0].T) {
				if (e.R[0].T === 'Language') {
					check = true
				}
				return check
			}

			return false
		})

		pdf = pdf.map((e, idx, arr) => {
			const res = {}
			const indexY = y.indexOf(e.y)
			const indexX = x.indexOf(x.find(r => e.x >= r))

			if (indexY < 0) {
				y.push(e.y)
				res.y = y.length - 1
			} else {
				res.y = indexY
			}

			res.x = indexX

			// Check if contents have next line
			if (res.x !== 2 && res.x !== 0 && res.y > 1 && arr.length !== idx + 1) {
				if (arr[idx + 1].y < e.y) {
					res.y -= 1
				}				
			}

			res.text = decodeURIComponent(e.R[0].T)

			return res
		})

		pdf = y.map((_, index) => {
			if (index <= 1) {
				return false
			}

			return pdf.filter(e => e.y === index)
		})
		pdf = pdf.filter(e => e)

		pdf = pdf.map(e => {
			return e.reduce((total, element) => {
				if (total[defaultKeys[element.x]]) {
					if (total[defaultKeys[element.x]].endsWith(" ") || total[defaultKeys[element.x]].endsWith("-") || element.x === 1) {
						total[defaultKeys[element.x]] += element.text						
					} else {
						total[defaultKeys[element.x]] += ` ${element.text}`
					}
				} else {
					total[defaultKeys[element.x]] = element.text
				}

				return total
			}, {...defaultData})
		})

		data = [...data, ...pdf]
	}

	data = data.filter(e => e.version)
	data = data.map(e => {
		e.id = Number(e.id)
		return e
	})

	const output = {}
	data.map(e => {
		output[e.tag.toLowerCase()] = {...e}
	})

	writeFileSync('./index.json', JSON.stringify(output, null, '\t'))
	console.timeEnd('build in')
})

pdfParser.loadPDF(filename)
