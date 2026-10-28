# Test plan — Kim Ngan (N1)

Principle: **every test case must prove one business rule (BR) or one use case
flow (UC)**. A test like `assertEquals(2, 1+1)` proves nothing.

## Unit tests — Report section 3.5

| ID | Class | Case | Proves |
|---|---|---|---|
| UT-01 | OrderStateMachine | all 9 valid transitions succeed | §2.9.2 |
| UT-02 | OrderStateMachine | DISPENSED → anything throws | terminal state |
| UT-03 | OrderStateMachine | UNCERTAIN cannot be left automatically | BR14, NFR4.5 |
| UT-04 | CommandSigner | sign then verify → valid | NFR2.6 |
| UT-05 | CommandSigner | one character changed → signature invalid | BR7 |
| UT-06 | CommandSigner | older than 30 s → expired | BR7 |
| UT-07 | OrderService | price changed after order → order keeps old price | BR4 |
| UT-08 | InventoryService | deducts the correct millilitres | BR10 |
| UT-09 | InventoryService | deducting more than remaining throws | BR10 |
| UT-10 | JwtService | token_version incremented → old token rejected | FR1.8 |

## Integration tests — Report section 3.6

| ID | Scenario | Expected result | Traces to |
|---|---|---|---|
| IT-01 | full flow, no faults | order DISPENSED, stock reduced exactly once | UC-05, UC-08, UC-09 |
| IT-02 | device rejects the command | order FAILED with reason, incident opened | BR7 |
| IT-03 | safety interlock blocks actuation | order FAILED, machine status updated, alert raised | BR8 |
| IT-04 | no result received | order UNCERTAIN, no second command issued | BR14, NFR4.5 |
| IT-05 | result published twice | stock deducted exactly once | NFR3.4 |
| IT-06 | machine stops sending heartbeats | machine OFFLINE, new orders refused | BR9 |
| IT-07 | Brand A admin reads Brand B data | 404, not 200 | BR13, NFR2.2 |
| IT-08 | Viewer calls a write endpoint | 403 | UC-17 |
| IT-09 | duplicate payment webhook | only one payment recorded | NFR3.3 |

**IT-04 and IT-05 are the two most valuable cases in the project.** If there is
only time for two integration tests, write these two.

## Results table — Report section 3.7

| ID | Test case | Input | Expected result | Actual result | Pass |
|---|---|---|---|---|---|
| IT-04 | Device does not respond (UC-08) | paid order, simulator `--fault=silent` | UNCERTAIN, no second command | | |

Record the **actual** result honestly. A failing case goes into Chapter 4 under
Limitations. A table of 25 cases with 23 passes is far more credible than one
where everything passes.
