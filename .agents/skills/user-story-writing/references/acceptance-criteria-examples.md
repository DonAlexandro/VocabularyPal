# Acceptance Criteria Examples

The following examples illustrate the expected style and granularity for DECS-UI user stories.
Combine related micro-steps into one criterion. Focus on observable outcomes, not implementation.

---

## Example 1: Setting a heater setpoint

### Acceptance criteria 1: Successfully update a heater setpoint

Given: I am a lab operator on the Overview page  
And: the Mercury heater device card is visible and showing the current setpoint  

When: I click the setpoint value on the card  
And: I enter a valid temperature value within the allowed range  
And: I confirm the change  

Then: the new setpoint is sent to the device via WAMP RPC  
And: the card updates to display the new setpoint  
And: the device RAG status reflects any change in state  

### Acceptance criteria 2: Reject an out-of-range setpoint

Given: I am entering a new setpoint value  

When: I enter a value outside the device's allowed range  
And: I attempt to confirm  

Then: I see an inline validation error indicating the allowed range  
And: the setpoint is not sent to the device  
And: I remain on the input form to correct the value  

### Acceptance criteria 3: Cancelled edit leaves device unchanged

Given: I have opened the setpoint input  

When: I click Cancel or close the modal without confirming  

Then: the device setpoint is unchanged  
And: no WAMP RPC call is made  

---

## Example 2: Running the Clean Trap wizard

### Acceptance criteria 1: Complete wizard successfully

Given: I am a lab operator on the Overview page  
And: the system is in a state that allows trap cleaning  

When: I launch the Clean Trap wizard  
And: I follow each step and confirm all manual actions  

Then: the wizard progresses through each automated step in sequence  
And: completed steps show a tick indicator  
And: the wizard closes with a success summary on the final step  

### Acceptance criteria 2: Wizard blocked when preconditions are not met

Given: the system is not in the required state for trap cleaning (e.g., turbo pump still running)  

When: I attempt to launch the Clean Trap wizard  

Then: the wizard does not start  
And: I see a message explaining which precondition is not satisfied  

### Acceptance criteria 3: Wizard step failure halts progression

Given: the wizard is running and an automated step encounters an error  

When: the step reports a failure via WAMP  

Then: the wizard pauses and displays an error message  
And: I am not automatically advanced to the next step  
And: I am given an option to retry or abort  

---

## Example 3: Viewing device status on the Schematic page

### Acceptance criteria 1: Schematic reflects live device state

Given: I am viewing the Schematic page  
And: at least one valve or pump is connected via WAMP  

When: the device state changes (e.g., a valve opens or closes)  

Then: the corresponding component on the schematic updates its colour/indicator within 2 seconds  
And: the update does not require a page reload  

### Acceptance criteria 2: Clicking a device shows its detail card

Given: I am viewing the Schematic page  

When: I click on a device component (valve, pump, pressure gauge)  

Then: the device's detail card appears with the current live readings  
And: the card shows the device name, RAG status, and relevant measured values  
