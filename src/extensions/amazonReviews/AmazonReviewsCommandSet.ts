import { override } from '@microsoft/decorators'
import { sp } from '@pnp/sp'
import {
  BaseListViewCommandSet,
  IListViewCommandSetExecuteEventParameters
} from '@microsoft/sp-listview-extensibility'
import Container from './components/container'

//import { Dialog } from '@microsoft/sp-dialog'
//import * as strings from 'AmazonReviewsCommandSetStrings'

export interface IAmazonReviewsCommandSetProperties {}

export default class AmazonReviewsCommandSet extends BaseListViewCommandSet<
  IAmazonReviewsCommandSetProperties
> {
  @override
  public onInit (): Promise<void> {
    return super.onInit().then(_ => sp.setup({ spfxContext: this.context }))
  }

  @override
  public onExecute (event: IListViewCommandSetExecuteEventParameters): void {
    switch (event.itemId) {
      case 'encode':
        const modal = new Container()
        modal.listId = this.context.pageContext.list.id.toString()
        modal.show()
        break
      default:
        throw new Error('Unknown command')
    }
  }
}
