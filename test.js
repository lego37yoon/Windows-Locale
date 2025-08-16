import locale from './index.json'
import { equal } from 'assert'

equal(locale['pt-br'].language, 'Portuguese')
equal(locale['pt-br'].location, 'Brazil')
equal(locale['pt-br'].id, 1046)
equal(locale['pt-br'].tag, 'pt-BR')
equal(locale['pt-br'].version, 'Release A')

console.log('Done!')
