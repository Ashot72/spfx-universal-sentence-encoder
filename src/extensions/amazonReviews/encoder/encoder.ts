import * as tf from '@tensorflow/tfjs'
const tfvis: any = require('@tensorflow/tfjs-vis')
import {
  load,
  UniversalSentenceEncoder
} from '@tensorflow-models/universal-sentence-encoder'

export default class Encoder {
  private encoder: UniversalSentenceEncoder
  private static RATINGS: number = 2
  private static MODEL_NAME = 'prediction-model'
  private xTrain: tf.Tensor2D

  public load = async () => (this.encoder = await load())

  public trainedModel = async (): Promise<tf.LayersModel> => {
    try {
      const loadedModel = await tf.loadLayersModel(
        `localstorage://${Encoder.MODEL_NAME}`
      )
      return loadedModel
    } catch (e) {
      return null
    }
  }

  public train = async (data): Promise<void> => {
    const trainedModel: tf.LayersModel = await this.trainedModel()

    if (trainedModel) return

    const model: tf.Sequential = tf.sequential()
    this.xTrain = await this.embed(data)

    model.add(
      tf.layers.dense({
        inputShape: [this.xTrain.shape[1]],
        activation: 'softmax',
        units: Encoder.RATINGS
      })
    )

    model.compile({
      loss: 'categoricalCrossentropy',
      optimizer: tf.train.adam(0.01),
      metrics: ['accuracy']
    })

    const yTrain: tf.Tensor = this.yTrain(data)

    await model.fit(this.xTrain, yTrain, {
      batchSize: 32,
      validationSplit: 0.1,
      shuffle: true,
      epochs: 90,
      callbacks: tfvis.show.fitCallbacks(
        { name: 'Training Performance' },
        ['loss', 'val_loss', 'acc', 'val_acc'],
        {
          callbacks: ['onEpochEnd']
        }
      )
    })

    await model.save(`localstorage://${Encoder.MODEL_NAME}`)
    model.dispose()
  }

  public process = async (data, comment: string) => {
    const xPredict = await this.embed([{ Review: comment }])

    const predict = await this.predict(xPredict)
    const similarity = await this.similarComment(data, xPredict)

    xPredict.dispose()
    return { ...predict, ...similarity }
  }

  public predict = async (xPredict: tf.Tensor2D) => {
    const model: tf.LayersModel = await this.trainedModel()
    const prediction: any = await model.predict(xPredict)
    const argMax: tf.Tensor1D = prediction.argMax(-1)

    const rating: number = argMax.dataSync()[0]
    const probability: number = prediction.dataSync()[rating]

    prediction.dispose()
    argMax.dispose()

    return { rating, probability }
  }

  private similarComment = async (data, xPredict: tf.Tensor2D) => {
    if (!this.xTrain) {
      this.xTrain = await this.embed(data)
    }

    let similarReviewScore = 0
    let similarReview = ''

    for (let i = 0; i < data.length; i++) {
      const score = this.xTrain
        .slice([i, 0], [1])
        .dot(xPredict.transpose())
        .dataSync()

      if (similarReviewScore < score[0]) {
        similarReviewScore = score[0]
        similarReview = data[i].Review
      }
    }

    return { similarReviewScore, similarReview }
  }

  private embed = async (data): Promise<tf.Tensor2D> => {
    const reviews = data.map(r => r.Review.toLowerCase())
    return await this.encoder.embed(reviews)
  }

  private yTrain = (data): tf.Tensor =>
    tf.tidy(() => {
      const buffer: tf.TensorBuffer<tf.Rank.R2, 'int32'> = tf.buffer(
        [data.length, Encoder.RATINGS],
        'int32'
      )

      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < Encoder.RATINGS; j++) {
          if (data[i].Rating === j) {
            buffer.set(1, i, j)
          }
        }
      }

      return buffer.toTensor()
    })
}
