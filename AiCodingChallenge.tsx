openapi: 3.1.0
info:
  title: AI Coding Challenge Generator API
  version: 1.0.0
  description: API for generating unique coding challenges using an AI service.
servers:
  - url: https://api.yourdomain.com
    description: Main API server
paths:
  /coding-challenges:
    get:
      summary: Generate a new AI coding challenge
      operationId: generateCodingChallenge
      description: |
        Requests the AI service to generate a new and unique coding challenge.
        Each request for this endpoint should return a newly generated problem.
        The challenge description is provided in Markdown format.
      responses:
        '200':
          description: Successfully generated a coding challenge.
          content:
            text/plain:
              schema:
                type: string
                description: The generated coding challenge content in Markdown format.
                example: |
                  # Coding Challenge: Array Deduplication

                  **Problem Statement:**
                  Given an array of integers `nums`, remove the duplicates in-place such that each unique element appears only once.
                  The relative order of the elements should be kept the same.
                  Since it is impossible to change the length of the array in some languages, you must instead have the result be placed in the first part of the array `nums`.
                  More formally, if there are `k` elements after removing the duplicates, then the first `k` elements of `nums` should hold the final result.
                  It does not matter what you leave beyond the first `k` elements.

                  Return `k` after placing the final result in the first `k` slots of `nums`.

                  Do not allocate extra space for another array. You must do this by modifying the input array in-place with O(1) extra memory.

                  **Example 1:**
                  Input: `nums = [1,1,2]`
                  Output: `2`, `nums` should be `[1,2,_]` (underscores represent irrelevant values)

                  **Example 2:**
                  Input: `nums = [0,0,1,1,1,2,2,3,3,4]`
                  Output: `5`, `nums` should be `[0,1,2,3,4,_,_,_,_,_]`

                  **Constraints:**
                  * `0 <= nums.length <= 3 * 10^4`
                  * `-100 <= nums[i] <= 100`
                  * `nums` is sorted in non-decreasing order.
        '500':
          description: Internal server error, unable to generate the challenge.
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: A message describing the error.
                    example: Failed to generate challenge: AI service is unavailable.