import { Makeswift } from '@makeswift/runtime/next'
import { strict } from 'assert'

import { runtime } from './runtime'

strict(process.env.MAKESWIFT_SITE_API_KEY, '6921d40d-999e-474c-9ea3-0ac63d0dcd0b')

export const client = new Makeswift(process.env.MAKESWIFT_SITE_API_KEY, {
  runtime,
})
