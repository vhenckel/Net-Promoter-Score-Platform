import { Request, Response } from "express"
import { getCustomRepository, Not, IsNull } from "typeorm"
import { SurveysUsersRepository } from "../repositories/SurveysUsersRepository"


class NpsController {
  async execute(request: Request, response: Response) {
    const { survey_id } = request.params

    const surveysUsersRepository = getCustomRepository(SurveysUsersRepository)
    const surveysUsers = await surveysUsersRepository.find({
      survey_id,
      value: Not(IsNull())
    })

    const detractor = []
    const promoters = []
    const passives = []

    surveysUsers.map(survey => {
      if (survey.value >= 0 && survey.value <= 6) {
        detractor.push(survey)
      } else if (survey.value >= 9 && survey.value <= 10) {
        promoters.push(survey)
      } else {
        passives.push(survey)
      }
    })
    const totalAnswers = surveysUsers.length

    const calculate = Number((((promoters.length - detractor.length) / totalAnswers) * 100).toFixed(2))

    return response
      .json({
        detractor,
        promoters,
        passives,
        totalAnswers,
        nps: calculate
      })

  }
}

export { NpsController }