from .think import create_plan


if __name__=="__main__":
    goal = input("What do you want to do?: ")
    plan = create_plan(goal)

    for s in plan.steps:
        print("Explanation:", s.explanation)
        print("Output", s.output)