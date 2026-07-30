import { useForm } from "react-hook-form";

export default function RegisterPage() {

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm();

    const onSubmit = async (data) => {

        console.log(data);

        /*
        Call Laravel API

        participantApi.register(data)

        */

    };

    return (

        <div className="min-h-screen bg-gray-100">

            <div className="max-w-2xl mx-auto py-10 px-5">

                <div className="bg-white rounded-2xl shadow-lg p-8">

                    <h1 className="text-3xl font-bold mb-2">
                        Student Registration
                    </h1>

                    <p className="text-gray-500 mb-8">
                        Complete your registration to begin the challenge.
                    </p>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-5"
                    >

                        {/* Full Name */}

                        <div>

                            <label className="font-medium">

                                Full Name

                            </label>

                            <input
                                type="text"
                                {...register("full_name")}
                                className="w-full border rounded-lg p-3 mt-2"
                            />

                        </div>

                        {/* Profile */}

                        <div>

                            <label>

                                Profile Photo (Optional)

                            </label>

                            <input
                                type="file"
                                accept="image/*"
                                className="w-full mt-2"
                            />

                        </div>

                        {/* Institute */}

                        <div>

                            <label>

                                Institute

                            </label>

                            <input
                                type="text"
                                {...register("institute")}
                                className="w-full border rounded-lg p-3 mt-2"
                            />

                        </div>

                        {/* Course */}

                        <div>

                            <label>

                                Course

                            </label>

                            <input
                                type="text"
                                {...register("course")}
                                className="w-full border rounded-lg p-3 mt-2"
                            />

                        </div>

                        {/* Year */}

                        <div>

                            <label>

                                Academic Year

                            </label>

                            <select
                                {...register("academic_year")}
                                className="w-full border rounded-lg p-3 mt-2"
                            >

                                <option value="">Select</option>

                                <option value="FY">FY</option>

                                <option value="SY">SY</option>

                                <option value="TY">TY</option>

                                <option value="Final">Final</option>

                            </select>

                        </div>

                        {/* Instagram */}

                        <div>

                            <label>

                                Instagram Handle

                            </label>

                            <input
                                type="text"
                                placeholder="@username"
                                {...register("instagram_handle")}
                                className="w-full border rounded-lg p-3 mt-2"
                            />

                        </div>

                        <button
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 text-white rounded-lg py-4 font-semibold hover:bg-blue-700"
                        >

                            Continue to Game

                        </button>

                    </form>

                </div>

            </div>

        </div>

    );

}