import { Request, Response } from "express"
import { resolve } from 'path'
import { getCustomRepository } from "typeorm"
import { AppError } from "../errors/AppError"
import { SurveysRepository } from "../repositories/SurveysRepository"
import { SurveysUsersRepository } from "../repositories/SurveysUsersRepository"
import { UsersRepository } from "../repositories/UsersRepository"
import SendMailService from "../services/SendMailService"

class SendMailController {
  async execute(request: Request, response: Response) {
    const { email, survey_id } = request.body
    const usersRepository = getCustomRepository(UsersRepository)
    const surveysRepository = getCustomRepository(SurveysRepository)
    const surveysUsersRepository = getCustomRepository(SurveysUsersRepository)

    const user = await usersRepository.findOne({
      email
    })
    if (!user) throw new AppError("User does not exists!")

    const survey = await surveysRepository.findOne({ id: survey_id })
    if (!survey) throw new AppError("Survey does not exists!")

    let surveyUserAlreadyExists = await surveysUsersRepository
      .findOne({
        where: { user_id: user.id, value: null, survey_id },
        relations: ["user", "survey"]
      })

    if (!surveyUserAlreadyExists) {
      surveyUserAlreadyExists = surveysUsersRepository.create({
        survey_id,
        user_id: user.id
      })
      await surveysUsersRepository.save(surveyUserAlreadyExists)
    }

    const npsPath = resolve(__dirname, "..", "views", "emails", "npsMail.hbs")

    const variables = {
      name: user.name,
      title: survey.title,
      description: survey.description,
      id: surveyUserAlreadyExists.id,
      link: process.env.URL_MAIL
    }

    await SendMailService.execute(email, survey.title, variables, npsPath)

    return response
      .status(200)
      .json({ user, survey })
  }
}

export { SendMailController }