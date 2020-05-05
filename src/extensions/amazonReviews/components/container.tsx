import { BaseDialog } from '@microsoft/sp-dialog'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import EncoderModal from './encoder-modal'

export default class Container extends BaseDialog {
    public listId: string

    public render() {
        const encoderModal = (<EncoderModal
            onDismiss={this.close}
            listId={this.listId}
        />)

        ReactDOM.render(encoderModal, this.domElement)
    }

    protected onAfterClose(): void {
        ReactDOM.unmountComponentAtNode(this.domElement)
    }
}
