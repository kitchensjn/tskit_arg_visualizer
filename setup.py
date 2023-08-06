from setuptools import setup

setup(
    name="tskit_arg_visualizer",
    version="0.1",
    url='https://github.com/kitchensjn/tskit_arg_visualizer',
    author="James Kitchens",
    author_email="kitchensjn@gmail.com",
    packages=["tskit_arg_visualizer"],
    install_requires=[
        "msprime",
        "jupyter",
        "IPython",
    ],
    include_package_data=True,
)