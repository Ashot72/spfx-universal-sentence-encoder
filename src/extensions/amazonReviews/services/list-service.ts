import { sp } from '@pnp/sp'
import { sortBy } from 'lodash'

export default class ListService {
  public getList = (listId: string): Promise<any> =>
    this.getFields(listId, ['InternalName']).then(fields => {
      const internalNames = fields.map(f => f.InternalName)
      return sp.web.lists
        .getById(listId)
        .items.select(...internalNames)
        .top(5000)
        .get()
    })

  public getListFields = (listId: string): Promise<any> =>
    this.getFields(listId, ['Title', 'InternalName']).then(fields => {
      const mapped = fields.map(d => ({
        key: d.InternalName,
        text: d.Title
      }))
      return sortBy(mapped, 'key')
    })

  private getFields = (listId: string, fields: string[]): Promise<any> =>
    sp.web.lists
      .getById(listId)
      .fields.select(...fields)
      .filter(
        `Hidden eq false and 
                     ReadOnlyField  eq false and 
                     Title ne 'Title' and 
                     Title ne 'Attachments' and 
                     Title ne 'Content Type'`
      )
      .get()
}
