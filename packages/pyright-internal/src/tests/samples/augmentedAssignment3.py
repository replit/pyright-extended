# This sample tests the case where an instance variable
# is assigned using only augmented assignment expressions.


class ClassA:
    def method1(self):
        # This should generate an error.
        self.val1 += 3
